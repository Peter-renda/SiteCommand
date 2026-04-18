"use client";

import { useMemo, useState } from "react";
import ProjectNav from "@/components/ProjectNav";

type Crew = {
  id: string;
  name: string;
};

type Employee = {
  id: string;
  name: string;
  role: string;
};

const CREWS: Crew[] = [
  { id: "crew-1", name: "Concrete Crew" },
  { id: "crew-2", name: "Framing Crew" },
  { id: "crew-3", name: "MEP Crew" },
];

const EMPLOYEES: Employee[] = [
  { id: "emp-1", name: "Jake Thompson", role: "Foreman" },
  { id: "emp-2", name: "Ava Nguyen", role: "Carpenter" },
  { id: "emp-3", name: "Marcus Lee", role: "Laborer" },
  { id: "emp-4", name: "Sofia Patel", role: "Electrician" },
  { id: "emp-5", name: "Daniel Cruz", role: "Plumber" },
  { id: "emp-6", name: "Mia Brooks", role: "Operator" },
];

export default function TimesheetsClient({
  projectId,
  username,
}: {
  projectId: string;
  username: string;
}) {
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [activeCrewId, setActiveCrewId] = useState(CREWS[0]?.id ?? "");
  const [assignments, setAssignments] = useState<Record<string, string[]>>(
    Object.fromEntries(CREWS.map((crew) => [crew.id, []])),
  );
  const [hasTimesheet, setHasTimesheet] = useState(false);
  const [showCopyHint, setShowCopyHint] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  const assignedEmployeeIds = useMemo(
    () => new Set(Object.values(assignments).flat()),
    [assignments],
  );

  const unassignedEmployees = EMPLOYEES.filter((employee) => !assignedEmployeeIds.has(employee.id));
  const allEmployeesAssigned = assignedEmployeeIds.size === EMPLOYEES.length;

  function handleSelectNewDailyTimesheet() {
    setIsCreateMenuOpen(false);
    setShowCopyHint(false);
    setHasTimesheet(false);
    setAssignments(Object.fromEntries(CREWS.map((crew) => [crew.id, []])));
    setActiveCrewId(CREWS[0]?.id ?? "");
    setIsBuilderOpen(true);
  }

  function handleSelectCopyFromDate() {
    setIsCreateMenuOpen(false);
    setShowCopyHint(true);
  }

  function assignEmployeeToActiveCrew(employeeId: string) {
    if (!activeCrewId) return;
    setAssignments((current) => {
      const next: Record<string, string[]> = {};
      Object.entries(current).forEach(([crewId, members]) => {
        next[crewId] = members.filter((memberId) => memberId !== employeeId);
      });
      next[activeCrewId] = [...(next[activeCrewId] ?? []), employeeId];
      return next;
    });
  }

  function removeEmployeeFromCrew(crewId: string, employeeId: string) {
    setAssignments((current) => ({
      ...current,
      [crewId]: (current[crewId] ?? []).filter((memberId) => memberId !== employeeId),
    }));
  }

  function handleCreateTimesheet() {
    if (!allEmployeesAssigned) return;
    setIsBuilderOpen(false);
    setHasTimesheet(true);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">SiteCommand</a>
        <div className="flex items-center gap-5"><span className="text-sm text-gray-400">{username}</span><button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">Logout</button></div>
      </header>
      <ProjectNav projectId={projectId} />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold text-gray-900">Timesheets</h1>
          <div className="relative">
            <button
              onClick={() => setIsCreateMenuOpen((current) => !current)}
              className="inline-flex items-center gap-2 rounded-md bg-gray-900 text-white text-sm font-medium px-4 py-2 hover:bg-gray-800 transition-colors"
            >
              Create
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M5.25 7.5L10 12.25 14.75 7.5" />
              </svg>
            </button>
            {isCreateMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20">
                <button
                  onClick={handleSelectNewDailyTimesheet}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                >
                  New Daily Timesheet
                </button>
                <button
                  onClick={handleSelectCopyFromDate}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100"
                >
                  Copy from any date
                </button>
              </div>
            )}
          </div>
        </div>

        {showCopyHint && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            Copy from any date flow is ready for wiring to your project data source.
          </div>
        )}

        {!hasTimesheet ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl px-6 py-16 flex flex-col items-center text-center">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">No daily timesheet created yet</h3>
            <p className="text-sm text-gray-400 max-w-sm">
              Click <span className="font-medium text-gray-600">Create</span> to start a new daily timesheet or copy
              from a previous date.
            </p>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Daily Timesheet</h2>
                <p className="text-sm text-gray-500">Crew and employee roster created for today.</p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                Ready
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {CREWS.map((crew) => {
                const members = (assignments[crew.id] ?? [])
                  .map((id) => EMPLOYEES.find((employee) => employee.id === id))
                  .filter(Boolean) as Employee[];
                return (
                  <article key={crew.id} className="bg-white border border-gray-200 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">{crew.name}</h3>
                    <ul className="space-y-2">
                      {members.map((member) => (
                        <li key={member.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{member.name}</span>
                          <span className="text-gray-400">{member.role}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {isBuilderOpen && (
        <div className="fixed inset-0 bg-gray-900/40 z-30 flex items-center justify-center p-6">
          <div className="w-full max-w-4xl bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">New Daily Timesheet</h2>
                <p className="text-sm text-gray-500">Assign every employee to a crew.</p>
              </div>
              <button
                onClick={() => setIsBuilderOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Close
              </button>
            </div>

            <div className="grid md:grid-cols-[230px_1fr] min-h-[420px]">
              <aside className="border-r border-gray-100 bg-gray-50 p-4">
                <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">Crews</h3>
                <ul className="space-y-2">
                  {CREWS.map((crew) => {
                    const count = assignments[crew.id]?.length ?? 0;
                    const isActive = activeCrewId === crew.id;
                    return (
                      <li key={crew.id}>
                        <button
                          onClick={() => setActiveCrewId(crew.id)}
                          className={`w-full text-left rounded-lg px-3 py-2 border text-sm transition-colors ${
                            isActive
                              ? "bg-gray-900 text-white border-gray-900"
                              : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="font-medium">{crew.name}</div>
                          <div className={`text-xs ${isActive ? "text-gray-200" : "text-gray-400"}`}>{count} added</div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>

              <section className="p-4">
                <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">All Employees</h3>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {unassignedEmployees.map((employee) => (
                    <li key={employee.id}>
                      <button
                        onClick={() => assignEmployeeToActiveCrew(employee.id)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-left hover:border-gray-400 transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-800">{employee.name}</p>
                        <p className="text-xs text-gray-400">{employee.role}</p>
                      </button>
                    </li>
                  ))}
                </ul>

                {unassignedEmployees.length === 0 && (
                  <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    All employees are assigned. Create the daily timesheet to continue.
                  </div>
                )}

                <div className="mt-4 border-t border-gray-100 pt-4">
                  <h4 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">
                    Assigned to selected crew
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(assignments[activeCrewId] ?? []).map((employeeId) => {
                      const employee = EMPLOYEES.find((item) => item.id === employeeId);
                      if (!employee) return null;
                      return (
                        <span
                          key={employeeId}
                          className="inline-flex items-center gap-2 text-xs bg-gray-100 text-gray-700 rounded-full px-3 py-1"
                        >
                          {employee.name}
                          <button
                            onClick={() => removeEmployeeFromCrew(activeCrewId, employeeId)}
                            className="text-gray-500 hover:text-gray-800"
                            aria-label={`Remove ${employee.name}`}
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {assignedEmployeeIds.size}/{EMPLOYEES.length} employees assigned
              </p>
              <button
                onClick={handleCreateTimesheet}
                disabled={!allEmployeesAssigned}
                className="rounded-md bg-gray-900 text-white text-sm font-medium px-4 py-2 disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              >
                Create Daily Timesheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
