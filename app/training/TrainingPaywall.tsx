/**
 * The "start your free trial to see more" wall shown to free accounts when they
 * reach premium training content (any lesson past the Pre-Construction &
 * Entitlements section, or the practice / skills / guides areas).
 *
 * Plain (non-client) component: just markup and links, so it can be rendered
 * from server components (the standalone lesson page, the practice/skills/guides
 * pages) and from client components (the inline module reader) alike.
 */

const DEFAULT_FEATURES = [
  "The full 100+ module curriculum across every project phase",
  "Hands-on project simulations in a real SiteCommand sandbox",
  "Your skills profile and the SiteCommand Certified credential",
  "Company guides and best-practice templates",
];

export default function TrainingPaywall({
  title = "Start your free trial to see more",
  description = "Your free account includes the Pre-Construction & Entitlements lessons, plus the Resources, Career Center, and Community pages. Start a free trial to unlock the rest of the training program.",
  features = DEFAULT_FEATURES,
  backHref,
  onBack,
}: {
  title?: string;
  description?: string;
  features?: string[];
  /** When set, renders a "Back to modules" link (server / cross-page use). */
  backHref?: string;
  /** When set, renders a "Back" button (client inline-reader use). */
  onBack?: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      {(backHref || onBack) &&
        (onBack ? (
          <button
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <span aria-hidden>←</span> Back
          </button>
        ) : (
          <a
            href={backHref}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <span aria-hidden>←</span> Back to modules
          </a>
        ))}

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Members only
        </div>

        <h1 className="mt-4 font-display text-2xl text-gray-950">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">{description}</p>

        <ul className="mt-6 space-y-3">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <a
            href="/pricing"
            className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Start free trial
          </a>
          <a
            href="/pricing"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            See plans
          </a>
        </div>

        <p className="mt-4 text-xs text-gray-400">All plans start with a 7-day free trial.</p>
      </div>
    </div>
  );
}
