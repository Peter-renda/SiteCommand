// ═══════════════════════════════════════════════════════════════════
// Dashboard — redesigned with SiteCommand design system
// ═══════════════════════════════════════════════════════════════════

function FocusCard({ focus, activeCount, totalValue }) {
  const { Eyebrow, Icon, Pill } = window.SCPrim;

  return (
    <div className="bezel ambient-hero">
      <div className="bezel-inner">
        <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-0">
          {/* Left — focus list */}
          <div className="p-7 pr-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Eyebrow>Today · Where you're needed</Eyebrow>
                <h1 className="mt-3 text-[30px] leading-[1.1] text-gray-900 font-display">
                  {focus.items.length} items <span className="serif-italic text-gray-500">need your attention</span>
                </h1>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-gray-500">
                <span className="font-mono tabular-nums">Wed, Nov 13</span>
                <span className="text-gray-300 mx-1.5">·</span>
                <span>7:42 AM</span>
              </div>
            </div>

            <ul className="space-y-0 divide-y hairline border-y hairline -mx-1">
              {focus.items.map((item, i) => (
                <li key={i} className="group flex items-center gap-4 px-1 py-3 hover:bg-gray-50/60 rounded cursor-pointer transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 grid place-items-center shrink-0 text-gray-600 group-hover:border-gray-300">
                    {item.kind === "rfi"       && Icon.rfi("text-[#D4500A]")}
                    {item.kind === "submittal" && Icon.submittal("text-indigo-500")}
                    {item.kind === "task"      && Icon.task("text-emerald-600")}
                    {item.kind === "log"       && Icon.daily_log("text-sky-600")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="mono-label">{item.ref}</span>
                      {item.danger && <Pill className="pill-danger">Overdue</Pill>}
                    </div>
                    <p className="text-[14px] text-gray-900 font-medium leading-snug mt-0.5 truncate">{item.title}</p>
                    <p className="text-[12px] text-gray-500 mt-0.5">{item.project}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[11px] ${item.danger ? "text-red-600 font-semibold" : "text-gray-500"}`}>{item.age}</span>
                    <span className="text-gray-300 group-hover:text-gray-700 transition-colors">{Icon.arrowRight()}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center gap-3">
              <button className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-[color:var(--ink)] rounded-md hover:bg-gray-800 transition-colors">
                Open inbox
                {Icon.arrowRight("w-3.5 h-3.5")}
              </button>
              <button className="text-[13px] font-medium text-gray-500 hover:text-gray-900 px-2 py-2 transition-colors">
                Jump to today's log
              </button>
            </div>
          </div>

          {/* Right — quick metrics column */}
          <div className="border-l hairline bg-gradient-to-b from-gray-50/60 to-white p-7 pl-6 flex flex-col gap-5">
            <div>
              <Eyebrow quiet>Portfolio</Eyebrow>
              <p className="mt-2 text-[28px] font-display tabular-nums text-gray-900 leading-none">
                ${(totalValue / 1_000_000).toFixed(1)}M
              </p>
              <p className="text-[12px] text-gray-500 mt-1">{activeCount} active · 6 total</p>
            </div>

            <div className="h-px bg-gray-100" />

            <div className="space-y-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-gray-600">Open RFIs</span>
                <span className="font-mono tabular-nums font-semibold text-gray-900">{focus.openRfis}</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-gray-600">Pending submittals</span>
                <span className="font-mono tabular-nums font-semibold text-gray-900">{focus.pendingSubmittals}</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-gray-600">Overdue tasks</span>
                <span className="font-mono tabular-nums font-semibold text-red-600">{focus.overdueTasks}</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-gray-600">Logs to review</span>
                <span className="font-mono tabular-nums font-semibold text-gray-900">{focus.logsNeedingReview}</span>
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            <div>
              <Eyebrow quiet>Weather · SF Bay Area</Eyebrow>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-[22px] font-display tabular-nums text-gray-900 leading-none">62°</span>
                <span className="text-[12px] text-gray-500">Partly Cloudy</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Low delay risk · 8 mph NW</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project }) {
  const { Eyebrow, Pill, Icon } = window.SCPrim;
  const pct = Math.round(project.progress * 100);
  const avatarColors = [
    "from-orange-400 to-orange-600",
    "from-teal-400 to-teal-600",
    "from-indigo-400 to-indigo-600",
    "from-slate-400 to-slate-600",
    "from-amber-400 to-amber-600",
  ];

  return (
    <a className="block bg-white border hairline rounded-xl overflow-hidden lift cursor-pointer group">
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="mono-label">{project.number}</span>
              <span className="text-gray-300">·</span>
              <span className="text-[11px] text-gray-500">{project.sector}</span>
            </div>
            <h3 className="text-[15px] font-semibold text-gray-900 leading-tight line-clamp-2 group-hover:text-gray-700 transition-colors">
              {project.name}
            </h3>
          </div>
          <Pill className={project.statusClass}>{project.statusLabel}</Pill>
        </div>

        <p className="text-[12px] text-gray-500 mb-4 truncate">{project.address}</p>

        {project.progress > 0 && project.status !== "warranty" && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-gray-500">Progress</span>
              <span className="text-[11px] font-mono tabular-nums font-semibold text-gray-900">{pct}%</span>
            </div>
            <div className="spark-track">
              <div className="spark-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Value</p>
            <p className="text-[18px] font-display tabular-nums text-gray-900 leading-none">
              ${(project.value / 1_000_000).toFixed(1)}M
            </p>
          </div>
          <div className="flex -space-x-1.5">
            {project.members.slice(0, 4).map((m, i) => (
              <div
                key={i}
                title={m}
                className={`w-6 h-6 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} border-2 border-white grid place-items-center text-[10px] font-semibold text-white`}
              >
                {m}
              </div>
            ))}
            {project.membersExtra > 0 && (
              <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white grid place-items-center text-[9px] font-semibold text-gray-600">
                +{project.membersExtra}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ───── Novel move: site-pulse footer ───── */}
      {project.lastLog === "Today" ? (
        <div className="border-t hairline bg-gray-50/60 px-5 py-2.5 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-4 tabular-nums">
            <span className="flex items-center gap-1 text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-medium">Logged today</span>
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600"><b className="text-gray-900 font-semibold">{project.today.manhours}</b> man-hrs</span>
            <span className="text-gray-600"><b className="text-gray-900 font-semibold">{project.today.photos}</b> photos</span>
            {project.today.rfis > 0 && <span className="text-[#D4500A] font-semibold">{project.today.rfis} open RFI{project.today.rfis > 1 ? 's' : ''}</span>}
          </div>
        </div>
      ) : project.lastLog === "Yesterday" ? (
        <div className="border-t hairline bg-amber-50/40 px-5 py-2.5 text-[11px] flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="font-medium">No log yet today</span>
          </span>
          <a className="text-gray-600 hover:text-gray-900 font-medium">Start log →</a>
        </div>
      ) : (
        <div className="border-t hairline bg-white px-5 py-2.5 text-[11px] text-gray-400">
          Not yet in construction
        </div>
      )}
    </a>
  );
}

function ActivityRow({ item }) {
  const { Icon } = window.SCPrim;
  const iconMap = {
    rfi: Icon.rfi("text-[#D4500A]"),
    submittal: Icon.submittal("text-indigo-500"),
    document: Icon.document("text-gray-500"),
    daily_log: Icon.daily_log("text-sky-600"),
    task: Icon.task("text-emerald-600"),
    drawing: Icon.drawing("text-orange-500"),
    photo: Icon.photo("text-cyan-600"),
  };
  const labelMap = {
    rfi: "RFI", submittal: "Submittal", document: "Document",
    daily_log: "Daily Log", task: "Task", drawing: "Drawing", photo: "Photos",
  };

  return (
    <a className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
      <div className="w-7 h-7 rounded-md bg-gray-50 border border-gray-100 grid place-items-center shrink-0">
        {iconMap[item.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-gray-900 truncate">{item.title}</p>
        <p className="text-[11px] text-gray-500 truncate">
          <span className="font-medium text-gray-600">{labelMap[item.type]}</span>
          {" · "}
          {item.project}
        </p>
      </div>
      <span className="text-[11px] text-gray-400 shrink-0 tabular-nums">{item.ago}</span>
    </a>
  );
}

function Dashboard() {
  const { Eyebrow, Icon } = window.SCPrim;
  const { projects, totalValue, activeCount, completedCount, focus, activity } = window.SCData;

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-sunken)" }}>
      <window.SCPrim.AppHeader />

      <main className="max-w-[1280px] mx-auto px-6 py-8">
        {/* ───── FOCUS CARD (novel move #1) ───── */}
        <div className="mb-10">
          <FocusCard focus={focus} activeCount={activeCount} totalValue={totalValue} />
        </div>

        {/* ───── Projects ───── */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <Eyebrow>Portfolio</Eyebrow>
            <h2 className="mt-2 text-[22px] font-display text-gray-900 leading-none">Projects</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1 p-0.5 bg-white border border-gray-200 rounded-md text-[11px] font-medium">
              <button className="px-3 py-1 rounded bg-gray-100 text-gray-900">All</button>
              <button className="px-3 py-1 rounded text-gray-500 hover:text-gray-900">Active</button>
              <button className="px-3 py-1 rounded text-gray-500 hover:text-gray-900">Bidding</button>
              <button className="px-3 py-1 rounded text-gray-500 hover:text-gray-900">Warranty</button>
            </div>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 bg-[color:var(--ink)] text-white text-[12px] font-semibold rounded-md hover:bg-gray-800 transition-colors">
              {Icon.plus("w-3.5 h-3.5")}
              New Project
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>

        {/* ───── Recent Activity ───── */}
        <div className="mt-12">
          <div className="flex items-end justify-between mb-5">
            <div>
              <Eyebrow>Signal</Eyebrow>
              <h2 className="mt-2 text-[22px] font-display text-gray-900 leading-none">Recent activity</h2>
            </div>
            <button className="text-[12px] font-medium text-gray-500 hover:text-gray-900">Filter</button>
          </div>
          <div className="bg-white border hairline rounded-xl divide-y divide-gray-50 overflow-hidden">
            {activity.map((item, i) => <ActivityRow key={i} item={item} />)}
            <button className="w-full px-4 py-3 text-[12px] text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors">
              Load more
            </button>
          </div>
        </div>

        <footer className="mt-12 pt-8 border-t hairline flex items-center justify-between text-[11px] text-gray-400">
          <span className="flex items-center gap-2">
            <window.SCPrim.LogoMark size={14} />
            SiteCommand · v2.4.1
          </span>
          <span>Last synced 12s ago</span>
        </footer>
      </main>
    </div>
  );
}

window.SCDashboard = Dashboard;
