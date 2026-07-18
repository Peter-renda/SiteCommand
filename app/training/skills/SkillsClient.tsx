"use client";

/**
 * Training → Skills & Credential.
 *
 * The trainee's competency profile: per-skill scores/levels with the evidence
 * behind them (scenario outcomes, meeting checkpoints, quiz averages, phase
 * reviews), headline stats, on-demand sandbox grading, and the credential —
 * eligibility checklist before it's earned; verify link + certificate
 * download once issued.
 */

import { useCallback, useEffect, useState } from "react";

type SkillComponent = { score: number; count: number };

type SkillScore = {
  key: string;
  label: string;
  description: string;
  score: number | null;
  level: string | null;
  components: {
    scenarios: SkillComponent | null;
    checkpoints: SkillComponent | null;
    quizzes: SkillComponent | null;
    phases: SkillComponent | null;
  };
  evidence: string[];
};

type Credential = {
  code: string;
  title: string;
  overall_level: string;
  overall_score: number;
  issued_at: string;
  updated_at: string;
};

type CompetencyResponse = {
  skills: SkillScore[];
  overall: { score: number | null; level: string | null };
  stats: {
    modulesQuizzed: number;
    quizAverage: number | null;
    checkpointsCaught: number;
    checkpointsTotal: number;
    walkPoints: number;
    walkTotal: number;
    scenariosHandled: number;
    scenariosEvaluated: number;
    scenariosPlanted: number;
    phaseReviews: number;
    sandboxes: number;
  };
  eligibility: { eligible: boolean; rules: { label: string; met: boolean }[] };
  credential: Credential | null;
};

type Sandbox = {
  id: string;
  name: string;
  training_role: string | null;
  training_day: number | null;
  archived_at: string | null;
};

function levelColor(level: string | null): string {
  switch (level) {
    case "Advanced":
      return "#15803D";
    case "Proficient":
      return "#2563EB";
    case "Competent":
      return "#B45309";
    default:
      return "#6B7280";
  }
}

const COMPONENT_LABELS: [keyof SkillScore["components"], string][] = [
  ["scenarios", "scenario decisions"],
  ["checkpoints", "meeting checkpoints"],
  ["quizzes", "module quizzes"],
  ["phases", "phase reviews"],
];

export default function SkillsClient() {
  const [data, setData] = useState<CompetencyResponse | null>(null);
  const [sandboxes, setSandboxes] = useState<Sandbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const [profileRes, projectsRes] = await Promise.all([
        fetch("/api/training/competency", { cache: "no-store" }),
        fetch("/api/training/projects", { cache: "no-store" }),
      ]);
      if (profileRes.ok) setData((await profileRes.json()) as CompetencyResponse);
      if (projectsRes.ok) {
        const body = (await projectsRes.json()) as { projects?: Sandbox[] };
        setSandboxes(
          (body.projects ?? []).filter((p) => p.training_role === "project_manager" && !p.archived_at),
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function evaluateSandbox(projectId: string) {
    setBusy(`eval-${projectId}`);
    setNotice("");
    try {
      const res = await fetch("/api/training/competency/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setNotice(body.error || "Grading failed — try again in a moment.");
        return;
      }
      await load();
      setNotice("Sandbox graded — profile refreshed.");
    } finally {
      setBusy("");
    }
  }

  async function issueCredential() {
    setBusy("issue");
    setNotice("");
    try {
      const res = await fetch("/api/training/credential", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setNotice(body.error || "Could not issue the credential.");
        return;
      }
      await load();
      setNotice("Credential issued.");
    } finally {
      setBusy("");
    }
  }

  function copyVerifyLink(code: string) {
    const url = `${window.location.origin}/verify/${code}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse">
            <div className="h-4 w-1/3 bg-gray-200 rounded mb-3" />
            <div className="h-3 w-2/3 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-6 text-sm text-gray-500">
        Couldn&apos;t load your skills profile. Refresh to try again.
      </div>
    );
  }

  const { skills, overall, stats, eligibility, credential } = data;
  const hasAnySignal = skills.some((s) => s.score !== null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Skills &amp; Credential</h1>
        <p className="text-sm text-gray-500 max-w-2xl">
          Every graded signal in your training — planted scenario decisions, meeting checkpoints,
          module quizzes, and phase job reviews — rolled into one competency profile.
        </p>
      </div>

      {notice && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(37,99,235,0.06)", color: "#1D4ED8", border: "1px solid rgba(37,99,235,0.15)" }}>
          {notice}
        </div>
      )}

      {/* Overall + stats */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Overall</p>
            {overall.score === null ? (
              <p className="text-sm text-gray-500">No graded signal yet</p>
            ) : (
              <p className="text-3xl font-semibold" style={{ color: levelColor(overall.level) }}>
                {overall.score}
                <span className="text-base font-medium text-gray-400">/100</span>{" "}
                <span className="text-sm font-semibold">{overall.level}</span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
            <span><strong>{stats.scenariosHandled}</strong>/{stats.scenariosEvaluated} scenarios handled</span>
            <span><strong>{stats.checkpointsCaught}</strong>/{stats.checkpointsTotal} checkpoints caught</span>
            {stats.walkTotal > 0 && (
              <span><strong>{Number.isInteger(stats.walkPoints) ? stats.walkPoints : stats.walkPoints.toFixed(1)}</strong>/{stats.walkTotal} site-walk Q&amp;A pts</span>
            )}
            <span><strong>{stats.modulesQuizzed}</strong> modules quizzed{stats.quizAverage !== null ? ` (avg ${stats.quizAverage}%)` : ""}</span>
            <span><strong>{stats.phaseReviews}</strong> phase review{stats.phaseReviews === 1 ? "" : "s"}</span>
          </div>
        </div>
      </div>

      {/* Credential */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">
          {credential ? "Your credential" : "Earn your credential"}
        </h2>
        {credential ? (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold mr-2" style={{ background: "rgba(21,128,61,0.1)", color: "#15803D" }}>
                ✓ SiteCommand Certified
              </span>
              <span className="font-mono text-xs">{credential.code}</span> · issued{" "}
              {new Date(credential.issued_at).toLocaleDateString()}
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={`/verify/${credential.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                Open verification page ↗
              </a>
              <button
                onClick={() => copyVerifyLink(credential.code)}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                {copied ? "Copied!" : "Copy verify link"}
              </button>
              <a
                href="/api/training/credential/certificate"
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                Download certificate (PDF)
              </a>
              <button
                onClick={issueCredential}
                disabled={busy === "issue"}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-600 transition-all disabled:opacity-50"
              >
                {busy === "issue" ? "Refreshing…" : "Refresh snapshot"}
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Put the verification link on your resume or LinkedIn — anyone can confirm it, no login
              needed. Refreshing keeps the same link with your latest scores.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Complete the requirements below to issue a verifiable{" "}
              <strong>SiteCommand Certified</strong> credential — a public verification page and a
              certificate you can put in front of employers.
            </p>
            <ul className="space-y-1.5 mb-4">
              {eligibility.rules.map((rule) => (
                <li key={rule.label} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={
                      rule.met
                        ? { background: "rgba(21,128,61,0.12)", color: "#15803D" }
                        : { background: "rgba(0,0,0,0.05)", color: "#9CA3AF" }
                    }
                  >
                    {rule.met ? "✓" : "·"}
                  </span>
                  <span className={rule.met ? "text-gray-700" : "text-gray-400"}>{rule.label}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={issueCredential}
              disabled={!eligibility.eligible || busy === "issue"}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40"
              style={{ background: "#EA580C" }}
            >
              {busy === "issue" ? "Issuing…" : "Issue my credential"}
            </button>
          </div>
        )}
      </div>

      {/* Skill bars */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Skill profile</h2>
        {!hasAnySignal && (
          <p className="text-sm text-gray-500 mb-4">
            No graded signal yet. Take module quizzes, run a Practice sandbox (the inbox plants real
            decisions that get graded), and complete meetings to build your profile.
          </p>
        )}
        <div className="space-y-4">
          {skills.map((skill) => {
            const expanded = expandedSkill === skill.key;
            return (
              <div key={skill.key}>
                <button
                  onClick={() => setExpandedSkill(expanded ? null : skill.key)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{skill.label}</span>
                    {skill.score === null ? (
                      <span className="text-xs text-gray-400">No signal yet</span>
                    ) : (
                      <span className="text-xs font-semibold" style={{ color: levelColor(skill.level) }}>
                        {skill.level} · {skill.score}/100
                      </span>
                    )}
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                    {skill.score !== null && (
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${skill.score}%`, background: levelColor(skill.level) }}
                      />
                    )}
                  </div>
                </button>
                {expanded && (
                  <div className="mt-2 pl-1 pb-1">
                    <p className="text-xs text-gray-400 mb-2">{skill.description}</p>
                    <p className="text-xs text-gray-500 mb-2">
                      {COMPONENT_LABELS.filter(([key]) => skill.components[key]).map(([key, label]) => {
                        const c = skill.components[key]!;
                        return `${label}: ${c.score}/100 (${c.count})`;
                      }).join(" · ") || "No components yet."}
                    </p>
                    {skill.evidence.length > 0 && (
                      <ul className="space-y-1">
                        {skill.evidence.map((line, i) => (
                          <li key={i} className="text-xs text-gray-600 leading-relaxed">
                            {line}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* On-demand sandbox grading */}
      {sandboxes.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Grade a sandbox now</h2>
          <p className="text-sm text-gray-500 mb-4">
            Scenario decisions are graded automatically as you complete days. Run a pass on demand
            to pick up anything new — only scenarios whose action window has closed get graded.
          </p>
          <div className="space-y-2">
            {sandboxes.map((sb) => (
              <div key={sb.id} className="flex items-center justify-between gap-4 py-1.5">
                <span className="text-sm text-gray-700 truncate">
                  {sb.name} <span className="text-xs text-gray-400">· Day {sb.training_day ?? 1}</span>
                </span>
                <button
                  onClick={() => evaluateSandbox(sb.id)}
                  disabled={busy === `eval-${sb.id}`}
                  className="shrink-0 px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  {busy === `eval-${sb.id}` ? "Grading…" : "Grade now"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
