/**
 * Public credential verification — /verify/[code].
 *
 * No auth: this page is the link a credential holder puts on a resume or
 * LinkedIn profile. It renders the stored profile snapshot from
 * training_credentials for the given code, or a clear "not found" state.
 */

import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return { title: `Credential ${code} – SiteCommand` };
}

type SnapshotSkill = {
  key?: string;
  label?: string;
  score?: number | null;
  level?: string | null;
  evidence?: string[];
};

type Snapshot = {
  skills?: SnapshotSkill[];
  stats?: {
    modulesQuizzed?: number;
    checkpointsCaught?: number;
    checkpointsTotal?: number;
    scenariosHandled?: number;
    scenariosEvaluated?: number;
    phaseReviews?: number;
  };
};

const bezelOuter: React.CSSProperties = {
  background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(235,235,233,0.5) 100%)",
  border: "1px solid rgba(0,0,0,0.055)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.7) inset",
  padding: "1.5px",
  borderRadius: "16px",
};

const bezelInner: React.CSSProperties = {
  background: "#FFFFFF",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
  borderRadius: "14px",
};

function levelColor(level: string | null | undefined): string {
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

export default async function VerifyCredentialPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalized = code.trim().toUpperCase();

  const { data: credential } = await getSupabase()
    .from("training_credentials")
    .select("code, holder_name, title, overall_level, overall_score, profile, issued_at, updated_at")
    .eq("code", normalized)
    .maybeSingle();

  const snapshot: Snapshot = (credential?.profile ?? {}) as Snapshot;
  const skills = (snapshot.skills ?? []).filter((s) => s.score !== null && s.score !== undefined);
  const stats = snapshot.stats ?? {};

  return (
    <div className="min-h-screen" style={{ background: "#FAFAF9" }}>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-16 pb-20">
        <Link href="/" className="inline-block mb-10">
          <span className="font-display text-lg text-gray-900">SiteCommand</span>
        </Link>

        {!credential ? (
          <div style={bezelOuter}>
            <div style={{ ...bezelInner, padding: "32px 28px" }}>
              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#B91C1C" }}>
                Not verified
              </p>
              <h1 className="font-display text-2xl text-gray-950 mb-2">Credential not found</h1>
              <p className="text-sm text-gray-500 leading-relaxed">
                No SiteCommand credential exists with the code <span className="font-mono">{normalized}</span>.
                Check the code for typos, or ask the holder for their current verification link.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div style={bezelOuter}>
              <div style={{ ...bezelInner, padding: "32px 28px" }}>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                    style={{ background: "rgba(21,128,61,0.1)", color: "#15803D" }}
                  >
                    ✓ Verified credential
                  </span>
                  <span className="font-mono text-[11px] text-gray-400">{credential.code}</span>
                </div>
                <h1 className="font-display text-3xl text-gray-950 mb-1">{credential.holder_name}</h1>
                <p className="text-sm text-gray-500 mb-4">{credential.title}</p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                  <span>
                    <span className="font-semibold" style={{ color: levelColor(credential.overall_level) }}>
                      {credential.overall_level}
                    </span>{" "}
                    <span className="text-gray-500">overall · {credential.overall_score}/100</span>
                  </span>
                  <span className="text-gray-400 text-xs">
                    Issued{" "}
                    {new Date(credential.issued_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {skills.length > 0 && (
              <div style={bezelOuter}>
                <div style={{ ...bezelInner, padding: "24px 28px" }}>
                  <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
                    Demonstrated skills
                  </h2>
                  <div className="space-y-3">
                    {skills.map((s) => (
                      <div key={s.key ?? s.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{s.label}</span>
                          <span className="text-xs font-semibold" style={{ color: levelColor(s.level) }}>
                            {s.level} · {s.score}/100
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${s.score}%`, background: levelColor(s.level) }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div style={bezelOuter}>
              <div style={{ ...bezelInner, padding: "24px 28px" }}>
                <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">
                  How this was earned
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  This credential was earned in SiteCommand&apos;s construction management training
                  program: a graded project simulation where decisions carry consequences. Signals
                  include{" "}
                  {typeof stats.scenariosEvaluated === "number" && stats.scenariosEvaluated > 0
                    ? `${stats.scenariosHandled ?? 0} of ${stats.scenariosEvaluated} live project scenarios handled correctly, `
                    : ""}
                  {typeof stats.checkpointsTotal === "number" && stats.checkpointsTotal > 0
                    ? `${stats.checkpointsCaught ?? 0} of ${stats.checkpointsTotal} meeting checkpoints caught, `
                    : ""}
                  {typeof stats.modulesQuizzed === "number" && stats.modulesQuizzed > 0
                    ? `graded quizzes across ${stats.modulesQuizzed} training modules, `
                    : ""}
                  and {stats.phaseReviews ?? 0} phase job review{(stats.phaseReviews ?? 0) === 1 ? "" : "s"}.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center">
              Verified by SiteCommand ·{" "}
              <Link href="/" className="underline underline-offset-2 hover:text-gray-600">
                Learn about the training program
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
