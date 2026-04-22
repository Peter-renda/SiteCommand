// ═══════════════════════════════════════════════════════════════════
// Shared primitives — applied from the SiteCommand design system
// ═══════════════════════════════════════════════════════════════════

function LogoMark({ size = 22 }) {
  // Hex-plane mark: teal + navy + orange from design system
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 1.5 L21.5 7 V17 L12 22.5 L2.5 17 V7 Z" fill="#2C7B8C" />
      <path d="M12 1.5 L21.5 7 V17 L12 22.5 Z" fill="#1E3A5F" />
      <path d="M12 12 L21.5 7 V17 L12 22.5 Z" fill="#E86F2C" />
      <path d="M12 1.5 L21.5 7 L12 12 L2.5 7 Z" fill="#2C7B8C" opacity="0.9" />
    </svg>
  );
}

function Brand({ className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark size={20} />
      <span className="text-[15px] font-semibold tracking-tight text-gray-900">SiteCommand</span>
    </div>
  );
}

function Eyebrow({ children, quiet = false }) {
  return <span className={`eyebrow ${quiet ? "eyebrow-quiet" : ""}`}>{children}</span>;
}

function Pill({ className = "", children }) {
  return <span className={`pill ${className}`}>{children}</span>;
}

// ─────────── AppHeader (shared) ───────────
function AppHeader({ onSwitchPage, currentPage }) {
  return (
    <header className="bg-white border-b border-gray-100">
      <div className="px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4 shrink-0">
          <Brand />
          <div className="w-px h-4 bg-gray-200" />
          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-gray-200 text-[11px] font-medium text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors">
            <span>Pacific Harbor Construction</span>
            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-gray-200 text-[11px] font-medium text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors">
            Company Tools
            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-[22rem]">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              placeholder="Search projects, RFIs, drawings…"
              className="w-full pl-9 pr-3 py-1.5 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 bg-gray-50 focus:bg-white"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-400 bg-white border border-gray-200 rounded px-1.5 py-0.5">⌘K</kbd>
          </div>
          <a className="text-[12px] font-medium text-gray-500 hover:text-gray-900 transition-colors">Team</a>
          <a className="text-[12px] font-medium text-gray-500 hover:text-gray-900 transition-colors">Settings</a>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 text-white text-xs font-semibold grid place-items-center">
            RM
          </div>
        </div>
      </div>
    </header>
  );
}

// ─────────── ProjectNav (used on Daily Log) ───────────
const PROJECT_NAV_SECTIONS = [
  {
    label: "Project",
    items: [
      { slug: "", name: "Home" },
      { slug: "directory", name: "Directory" },
      { slug: "tasks", name: "Tasks" },
      { slug: "schedule", name: "Schedule" },
    ],
  },
  {
    label: "Field",
    items: [
      { slug: "daily-log", name: "Daily Log" },
      { slug: "photos", name: "Photos" },
      { slug: "drawings", name: "Drawings" },
      { slug: "punchlist", name: "Punch List" },
    ],
  },
  {
    label: "Communication",
    items: [
      { slug: "rfis", name: "RFIs" },
      { slug: "submittals", name: "Submittals" },
      { slug: "transmittals", name: "Transmittals" },
      { slug: "meetings", name: "Meetings" },
    ],
  },
  {
    label: "Cost",
    items: [
      { slug: "budget", name: "Budget" },
      { slug: "change-orders", name: "Change Orders" },
      { slug: "invoices", name: "Invoices" },
    ],
  },
];

function ProjectNav({ projectName, projectNumber, activeSlug = "daily-log" }) {
  const [open, setOpen] = React.useState(false);
  const favorites = [
    { slug: "daily-log", name: "Daily Log" },
    { slug: "rfis", name: "RFIs" },
    { slug: "submittals", name: "Submittals" },
    { slug: "drawings", name: "Drawings" },
    { slug: "photos", name: "Photos" },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 relative">
      <div className="px-6 flex items-center gap-4 h-11">
        <div className="flex items-center gap-3 shrink-0">
          <a className="text-gray-400 hover:text-gray-700 transition-colors" title="All Projects">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </a>
          <div className="w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="mono-label shrink-0">{projectNumber}</span>
            <span className="text-[13px] font-semibold text-gray-900 truncate max-w-[280px]">{projectName}</span>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Tools
              <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {open && (
              <div className="absolute left-0 top-full mt-1 w-[880px] bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] p-5 grid grid-cols-4 gap-6">
                {PROJECT_NAV_SECTIONS.map((section) => (
                  <div key={section.label}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{section.label}</p>
                    <div className="space-y-0.5">
                      {section.items.map((item) => (
                        <a key={item.slug} className="block px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-5 flex-1 min-w-0 overflow-x-auto">
          <div className="w-px h-4 bg-gray-200 shrink-0" />
          {favorites.map((f) => (
            <a
              key={f.slug}
              className={`text-[13px] transition-colors shrink-0 ${
                f.slug === activeSlug
                  ? "text-gray-900 font-semibold"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {f.name}
            </a>
          ))}
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <Pill className="pill-coc">In Construction · 62%</Pill>
        </div>
      </div>
    </nav>
  );
}

// Small icon set
const Icon = {
  rfi: (c = "") => (
    <svg className={`w-4 h-4 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  submittal: (c = "") => (
    <svg className={`w-4 h-4 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  document: (c = "") => (
    <svg className={`w-4 h-4 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  daily_log: (c = "") => (
    <svg className={`w-4 h-4 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  task: (c = "") => (
    <svg className={`w-4 h-4 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  drawing: (c = "") => (
    <svg className={`w-4 h-4 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  photo: (c = "") => (
    <svg className={`w-4 h-4 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  plus: (c = "") => (
    <svg className={`w-4 h-4 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  arrowRight: (c = "") => (
    <svg className={`w-4 h-4 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  ),
  chevronLeft: (c = "") => (
    <svg className={`w-4 h-4 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  chevronRight: (c = "") => (
    <svg className={`w-4 h-4 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  cloud: (c = "") => (
    <svg className={`w-4 h-4 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999A5.002 5.002 0 006 5a5 5 0 00-4 9z" />
    </svg>
  ),
  sun: (c = "") => (
    <svg className={`w-4 h-4 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  wind: (c = "") => (
    <svg className={`w-4 h-4 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2" />
    </svg>
  ),
  drop: (c = "") => (
    <svg className={`w-4 h-4 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l6 7.5a6 6 0 11-12 0L12 3z" />
    </svg>
  ),
  check: (c = "") => (
    <svg className={`w-3 h-3 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  alert: (c = "") => (
    <svg className={`w-4 h-4 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
    </svg>
  ),
  copy: (c = "") => (
    <svg className={`w-3.5 h-3.5 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
};

window.SCPrim = { LogoMark, Brand, Eyebrow, Pill, AppHeader, ProjectNav, Icon };
