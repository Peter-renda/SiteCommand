/**
 * Scenario evaluation + consequence ("ripple") engine for PM training
 * sandboxes.
 *
 * Runs on every day advance (best-effort from the day-advance PATCH) and on
 * demand from the Skills page:
 *
 *   1. EVALUATE — for each planted scenario (lib/training-scenarios.ts) whose
 *      deadline day has passed, gather the trainee's actual behavior — emails
 *      they sent in the sandbox inbox plus tasks they created — and judge it
 *      handled/missed against the scenario's expectation. Gemini does the
 *      judging (structured output, same pattern as meeting minutes); without
 *      GEMINI_API_KEY a keyword heuristic decides. Outcomes upsert to
 *      training_scenario_outcomes.
 *
 *      Forgiveness rule: a scenario judged "missed" is re-evaluated on later
 *      runs while its ripple email hasn't been delivered yet — acting late
 *      (but before the consequence lands) still counts. Once the ripple is
 *      out, the outcome is final.
 *
 *   2. RIPPLE — once a scenario's ripple day arrives, deliver its consequence
 *      email (missed) or confirmation email (handled) into the sandbox inbox
 *      as an ordinary stored thread — decisions visibly matter weeks later.
 *      Idempotent via deterministic graph_conversation_ids.
 */

import { GoogleGenAI, Type } from "@google/genai";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  scenariosForType,
  scenarioConversationId,
  type TrainingScenario,
} from "@/lib/training-scenarios";
import { inboxSendersForType, inboxSenderEmail, type InboxCtx } from "@/lib/training-inbox";
import { resolveTrainingPmIdentity, pmAddressSet } from "@/lib/training-identity";
import { projectTypeLabel } from "@/lib/simulation-constants";

export type ScenarioOutcomeRow = {
  scenario_id: string;
  status: "handled" | "missed";
  note: string;
  evidence: string;
  evaluated_day: number;
  consequence_delivered_at: string | null;
};

type TraineeMessage = { subject: string; body: string; sentAt: string; convId: string };
type TraineeTask = { title: string; description: string };

function clip(text: string, max: number): string {
  const t = String(text ?? "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
}

function stripHtml(html: string): string {
  return String(html ?? "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/* ── evidence gathering ──────────────────────────────────────────────── */

function evidenceFor(
  scenario: TrainingScenario,
  messages: TraineeMessage[],
  tasks: TraineeTask[],
): { text: string; hits: TraineeMessage[] } {
  const canonical = new Set(scenario.threadSlugs.map((s) => `training-inbox-${s}`));
  const hits = messages.filter(
    (m) =>
      canonical.has(m.convId) ||
      scenario.topics.test(m.subject) ||
      scenario.topics.test(m.body),
  );
  const taskHits = tasks.filter((t) =>
    scenario.topics.test(`${t.title} ${t.description}`),
  );

  const parts: string[] = [];
  for (const m of hits.slice(0, 5)) {
    parts.push(`EMAIL SENT by trainee (re: "${clip(m.subject, 120)}"): ${clip(m.body, 700)}`);
  }
  for (const t of taskHits.slice(0, 5)) {
    parts.push(`TASK CREATED by trainee: "${clip(t.title, 160)}"${t.description ? ` — ${clip(t.description, 240)}` : ""}`);
  }
  return { text: parts.join("\n"), hits };
}

/** Degraded-mode heuristic used when Gemini is unavailable. */
function keywordJudge(scenario: TrainingScenario, evidence: string): { handled: boolean; note: string } {
  const lower = evidence.toLowerCase();
  const handled = scenario.handledKeywords.some((k) => lower.includes(k.toLowerCase()));
  return {
    handled,
    note: handled
      ? "The trainee took action on this before the deadline."
      : "No decisive action on this was found before the deadline.",
  };
}

async function judgeScenarios(
  toJudge: { scenario: TrainingScenario; evidence: string }[],
  traineeName: string,
): Promise<Map<string, { handled: boolean; note: string }>> {
  const results = new Map<string, { handled: boolean; note: string }>();
  const apiKey = process.env.GEMINI_API_KEY;

  const fallbackAll = () => {
    for (const { scenario, evidence } of toJudge) {
      results.set(scenario.id, keywordJudge(scenario, evidence));
    }
    return results;
  };
  if (!apiKey || toJudge.length === 0) return fallbackAll();

  const scenarioBlock = toJudge
    .map(
      ({ scenario, evidence }) => `SCENARIO id "${scenario.id}" — ${scenario.title}
Handled means: ${scenario.expectation}
Trainee's actions on record:
${evidence || "(none found)"}`,
    )
    .join("\n\n---\n\n");

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `=== SCENARIOS TO GRADE ===\n\n${scenarioBlock}\n\nGrade each scenario now.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: `You are grading ${traineeName || "a trainee"}, a construction project manager trainee running a simulated project. Each scenario below planted a real decision in front of them (via email), and you must decide — strictly from their recorded actions — whether they HANDLED it (took the substantively right action the expectation describes, even imperfectly worded) or MISSED it (no action, or action that ignores the core issue). Merely acknowledging an email without acting is not handling it. Give a one-sentence note per scenario citing what they did or failed to do. Return every scenario id exactly once.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            outcomes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, enum: toJudge.map((t) => t.scenario.id) },
                  handled: { type: Type.BOOLEAN },
                  note: { type: Type.STRING },
                },
                required: ["id", "handled", "note"],
              },
            },
          },
          required: ["outcomes"],
        },
      },
    });

    const parsed = JSON.parse((result.text ?? "").trim() || "{}") as {
      outcomes?: { id?: string; handled?: boolean; note?: string }[];
    };
    for (const { scenario, evidence } of toJudge) {
      const hit = (parsed.outcomes ?? []).find((o) => o.id === scenario.id);
      if (hit) {
        results.set(scenario.id, {
          handled: !!hit.handled,
          note: clip(hit.note || (hit.handled ? "Handled." : "Missed."), 400),
        });
      } else {
        results.set(scenario.id, keywordJudge(scenario, evidence));
      }
    }
    return results;
  } catch {
    return fallbackAll();
  }
}

/* ── the engine ──────────────────────────────────────────────────────── */

/**
 * Evaluates due scenarios and delivers due ripple emails for a PM sandbox.
 * Never throws — callers treat it as best-effort.
 */
export async function runTrainingScenarioEngine(
  supabase: SupabaseClient,
  opts: { projectId: string; day: number },
): Promise<void> {
  try {
    await runEngine(supabase, opts);
  } catch {
    /* best-effort */
  }
}

async function runEngine(
  supabase: SupabaseClient,
  opts: { projectId: string; day: number },
): Promise<void> {
  const { data: project } = await supabase
    .from("projects")
    .select("id, is_training, training_role, training_owner_id, training_project_type, company_id")
    .eq("id", opts.projectId)
    .maybeSingle();
  if (!project?.is_training || project.training_role !== "project_manager" || !project.training_owner_id) {
    return;
  }

  // Anything to do at all? (Cheap gate before loading evidence.) The scenario
  // set depends on the sandbox's project type (healthcare uses the VA pack).
  const projectType = project.training_project_type ?? "";
  const dueScenarios = scenariosForType(projectType).filter((s) => s.deadlineDay < opts.day);
  if (dueScenarios.length === 0) return;

  const { data: outcomeRows } = await supabase
    .from("training_scenario_outcomes")
    .select("scenario_id, status, note, evidence, evaluated_day, consequence_delivered_at")
    .eq("project_id", opts.projectId);
  const outcomes = new Map<string, ScenarioOutcomeRow>(
    ((outcomeRows ?? []) as ScenarioOutcomeRow[]).map((r) => [r.scenario_id, r]),
  );

  // Evaluate: never-evaluated scenarios, plus "missed" ones whose ripple
  // hasn't fired yet (late action before the consequence still counts).
  const needsEval = dueScenarios.filter((s) => {
    const row = outcomes.get(s.id);
    if (!row) return true;
    return row.status === "missed" && !row.consequence_delivered_at;
  });

  // Ripples due regardless of whether evaluation runs this pass.
  const ripplesPossible = dueScenarios.some((s) => {
    const ripDay = Math.min(s.consequence?.day ?? Infinity, s.confirmation?.day ?? Infinity);
    return ripDay <= opts.day;
  });
  if (needsEval.length === 0 && !ripplesPossible) return;

  // ── Resolve trainee + context (shared by evaluation and delivery) ──
  // The trainee participates under a FAKE simulated PM address; match their
  // sent mail against it (and their legacy real address, for older rows).
  const pm = await resolveTrainingPmIdentity(supabase, {
    userId: project.training_owner_id,
    companyId: project.company_id,
  });
  const pmName = pm.name;
  const pmEmail = pm.email;
  const pmFirst = pm.first;
  const meSet = pmAddressSet(pm);
  const domain = pm.domain;
  const ctx: InboxCtx = {
    pmFirst,
    pmName,
    projectLabel: projectTypeLabel(project.training_project_type ?? ""),
    companyName: pm.companyName,
  };

  // ── Evaluation pass ──
  if (needsEval.length > 0) {
    // The trainee's sent mail across all sandbox threads (they're all local).
    const { data: threads } = await supabase
      .from("project_email_threads")
      .select("id, graph_conversation_id")
      .eq("project_id", opts.projectId);
    const convById = new Map<string, string>(
      ((threads ?? []) as { id: string; graph_conversation_id: string }[]).map((t) => [
        t.id,
        t.graph_conversation_id,
      ]),
    );

    const { data: rawMessages } = await supabase
      .from("project_email_messages")
      .select("thread_id, subject, body_text, body_html, sent_at, from_address, from_name")
      .eq("project_id", opts.projectId)
      .order("sent_at", { ascending: true })
      .limit(500);

    const traineeMessages: TraineeMessage[] = ((rawMessages ?? []) as {
      thread_id: string;
      subject: string | null;
      body_text: string | null;
      body_html: string | null;
      sent_at: string | null;
      from_address: string | null;
      from_name: string | null;
    }[])
      .filter(
        (m) =>
          meSet.has((m.from_address ?? "").toLowerCase()) ||
          (m.from_name ?? "") === pmName,
      )
      .map((m) => ({
        subject: m.subject ?? "",
        body: m.body_text || stripHtml(m.body_html ?? ""),
        sentAt: m.sent_at ?? "",
        convId: convById.get(m.thread_id) ?? "",
      }));

    const { data: rawTasks } = await supabase
      .from("tasks")
      .select("title, description")
      .eq("project_id", opts.projectId)
      .limit(200);
    const tasks: TraineeTask[] = ((rawTasks ?? []) as { title: string | null; description: string | null }[]).map(
      (t) => ({ title: t.title ?? "", description: t.description ?? "" }),
    );

    const withEvidence = needsEval.map((scenario) => ({
      scenario,
      evidence: evidenceFor(scenario, traineeMessages, tasks).text,
    }));

    // Skip re-judging a "missed" row whose evidence hasn't changed — nothing
    // new to consider, and it keeps day advances cheap.
    const toJudge = withEvidence.filter(({ scenario, evidence }) => {
      const row = outcomes.get(scenario.id);
      if (!row) return true;
      return clip(evidence, 1500) !== row.evidence;
    });

    if (toJudge.length > 0) {
      // No evidence at all = missed without burning a model call.
      const judged = await judgeScenarios(
        toJudge.filter((t) => t.evidence.trim().length > 0),
        pmName,
      );

      for (const { scenario, evidence } of toJudge) {
        const verdict = evidence.trim()
          ? judged.get(scenario.id) ?? keywordJudge(scenario, evidence)
          : {
              handled: false,
              note: "No response or action on this was found before the deadline.",
            };

        const row = {
          project_id: opts.projectId,
          scenario_id: scenario.id,
          status: verdict.handled ? "handled" : "missed",
          note: verdict.note,
          evidence: clip(evidence, 1500),
          evaluated_day: opts.day,
          evaluated_at: new Date().toISOString(),
        };
        await supabase
          .from("training_scenario_outcomes")
          .upsert(row, { onConflict: "project_id,scenario_id" });
        outcomes.set(scenario.id, { ...row, consequence_delivered_at: null } as ScenarioOutcomeRow);
      }
    }
  }

  // ── Ripple delivery pass ──
  for (const scenario of dueScenarios) {
    const row = outcomes.get(scenario.id);
    if (!row || row.consequence_delivered_at) continue;

    const ripple = row.status === "missed" ? scenario.consequence : scenario.confirmation;
    if (!ripple || ripple.day > opts.day) continue;

    const sender = inboxSendersForType(projectType)[ripple.senderKey];
    if (!sender) continue;
    const senderName = `${sender.first} ${sender.last}`;
    const senderAddr = inboxSenderEmail(sender, domain);
    const convId = scenarioConversationId(scenario.id, row.status === "missed" ? "consequence" : "confirmation");

    // Idempotence: skip if the ripple thread already exists (a previous pass
    // delivered it but failed to stamp the outcome row).
    const { data: existing } = await supabase
      .from("project_email_threads")
      .select("id")
      .eq("project_id", opts.projectId)
      .eq("graph_conversation_id", convId)
      .maybeSingle();

    if (!existing) {
      const bodyHtml = ripple.html(ctx);
      const bodyText = stripHtml(bodyHtml);
      const sentIso = new Date().toISOString();

      const { data: thread } = await supabase
        .from("project_email_threads")
        .insert({
          project_id: opts.projectId,
          graph_conversation_id: convId,
          subject: ripple.subject,
          participants: [senderName, pmName],
          latest_message_preview: bodyText.slice(0, 280),
          latest_received_at: sentIso,
          message_count: 1,
          linked_by: project.training_owner_id,
          linked_at: sentIso,
        })
        .select("id")
        .single();
      if (!thread?.id) continue;

      await supabase.from("project_email_messages").insert({
        thread_id: thread.id,
        project_id: opts.projectId,
        provider_message_id: `${convId}-1`,
        from_name: senderName,
        from_address: senderAddr,
        to_recipients: [{ name: pmName, address: pmEmail || `pm@${domain}` }],
        cc_recipients: [],
        subject: ripple.subject,
        sent_at: sentIso,
        body_text: bodyText,
        body_html: bodyHtml,
        snippet: bodyText.slice(0, 200),
        synced_at: sentIso,
      });
    }

    await supabase
      .from("training_scenario_outcomes")
      .update({ consequence_delivered_at: new Date().toISOString() })
      .eq("project_id", opts.projectId)
      .eq("scenario_id", scenario.id);
  }
}
