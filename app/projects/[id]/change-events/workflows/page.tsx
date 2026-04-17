import Link from "next/link";
import { redirect } from "next/navigation";
import ProjectNav from "@/components/ProjectNav";
import { getSession } from "@/lib/auth";
import { checkProjectAccess } from "@/lib/permissions";

type WorkflowCard = {
  title: string;
  summary: string;
  steps: string[];
  procoreManualUrl?: string;
  siteCommandParity: "Supported" | "Partially Supported";
  note?: string;
  ctaPath: string;
  ctaLabel: string;
};

const WORKFLOWS: WorkflowCard[] = [
  {
    title: "Create a Change Event from a T&M Ticket",
    summary:
      "Use Bulk Actions in T&M Tickets to create a new change event from selected ticket(s).",
    steps: [
      "Open T&M Tickets > All Tickets.",
      "Select one or more tickets.",
      "Choose Bulk Actions > Create Change Event.",
      "Review the generated change event and continue with line-item updates.",
    ],
    note:
      "When available, include ticket links and attachment references in the Change Event description so teams can trace source backup.",
    ctaPath: "/projects/:projectId/tm-tickets",
    ctaLabel: "Use T&M Bulk Actions",
  },
  {
    title: "Create a Change Event from an Observation",
    summary:
      "Open an observation in view mode, then create a change event from the observation actions menu.",
    steps: [
      "Navigate to Observations and open an item in view mode.",
      "Choose More Actions (⋮) > Create Change Event.",
      "Review the new event details and add any financial impact line items.",
    ],
    ctaPath: "/solutions/quality-and-safety",
    ctaLabel: "Open Observation Guidance",
  },
  {
    title: "Create a Change Event from an RFI",
    summary:
      "From RFI view mode, launch a change event with prefilled source context.",
    steps: [
      "Open Project RFIs and select the desired RFI.",
      "Click + Create Change Event.",
      "Confirm title, origin, and description, then save the event.",
    ],
    note: "The action appears in RFI view mode (not edit mode).",
    ctaPath: "/projects/:projectId/rfis",
    ctaLabel: "Go to RFIs",
  },
  {
    title: "Create a Funding Change Order from a Change Event",
    summary:
      "SiteCommand does not currently have a separate Funding tool. Use the client contract change-order workflow as the equivalent financial path.",
    steps: [
      "Navigate to Change Events and select one or more line items.",
      "Use Bulk Actions > Create Client Contract CO.",
      "Select the contract and complete the change-order form fields.",
      "Track approvals and updates in the change order record.",
    ],
    procoreManualUrl:
      "https://v2.support.procore.com/product-manuals/change-events-project/tutorials/create-a-funding-change-order-from-a-change-event/",
    siteCommandParity: "Partially Supported",
    note:
      "Terminology mapping: Procore's Funding CO flow maps to SiteCommand's Client Contract CO flow.",
    ctaPath: "/projects/:projectId/change-events",
    ctaLabel: "Open Change Events",
  },
  {
    title: "Create a Potential Change Order for a Client Contract from a Change Event",
    summary:
      "Use Bulk Actions from Change Events to add selected line items into an unapproved client contract change order (PCO equivalent).",
    steps: [
      "Select one or more change event line items.",
      "Open Bulk Actions > Add to Unapproved Client Contract CO.",
      "Choose a matching unapproved PCO from the submenu.",
      "Review the target record and finish required change-order details.",
    ],
    procoreManualUrl:
      "https://v2.support.procore.com/product-manuals/change-events-project/tutorials/create-a-potential-change-order-for-a-client-contract-from-a-change-event/",
    siteCommandParity: "Supported",
    note:
      "If you need a brand-new record first, create a new Client Contract CO and leave it unapproved while drafting.",
    ctaPath: "/projects/:projectId/change-events",
    ctaLabel: "Open Change Events",
  },
  {
    title: "Create a Prime Contract Change Order from a Change Event",
    summary:
      "From Change Events, use Bulk Actions to launch a new client/prime contract change order with selected line items.",
    steps: [
      "Select one or more change event line items.",
      "Open Bulk Actions > Create Client Contract CO.",
      "Pick the client contract and complete change order fields.",
    ],
    procoreManualUrl:
      "https://v2.support.procore.com/product-manuals/change-events-project/tutorials/create-a-prime-contract-change-order-from-a-change-event/",
    siteCommandParity: "Supported",
    note:
      "SiteCommand uses 'Client Contract CO' language where Procore documentation uses 'Prime Contract CO'.",
    ctaPath: "/projects/:projectId/change-events",
    ctaLabel: "Open Change Events",
  },
  {
    title: "Create a Prime Potential Change Order from a Change Event",
    summary:
      "Use Bulk Actions to add selected line items to an unapproved client/prime contract change order (prime PCO equivalent).",
    steps: [
      "Select one or more change event line items.",
      "Open Bulk Actions > Add to Unapproved Client Contract CO.",
      "Choose the unapproved PCO to receive the selected line items.",
      "Finalize the PCO details and approval routing on the change-order record.",
    ],
    procoreManualUrl:
      "https://v2.support.procore.com/product-manuals/change-events-project/tutorials/create-a-prime-potential-change-order-from-a-change-event/",
    siteCommandParity: "Supported",
    note:
      "Only unapproved client contract change orders appear in this submenu, which aligns with potential-change-order behavior.",
    ctaPath: "/projects/:projectId/change-events",
    ctaLabel: "Open Change Events",
  },
  {
    title: "Create a Commitment Change Order from a Change Event",
    summary:
      "From Change Events, use Bulk Actions to create a commitment CO from selected line items.",
    steps: [
      "Select one or more change event line items.",
      "Open Bulk Actions > Create Commitment CO.",
      "Pick the commitment and complete change order details.",
    ],
    siteCommandParity: "Supported",
    ctaPath: "/projects/:projectId/change-events",
    ctaLabel: "Open Change Events",
  },
];

export default async function ChangeEventWorkflowsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id: projectId } = await params;
  try {
    await checkProjectAccess(session.id, projectId);
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectNav projectId={projectId} />
      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
            Change Management
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">Workflow Guides</h1>
          <p className="mt-2 text-sm text-gray-600">
            Reference workflows aligned to SiteCommand&apos;s change-event process.
          </p>
        </div>

        <div className="space-y-4">
          {WORKFLOWS.map((workflow) => (
            <section
              key={workflow.title}
              className="rounded-lg border border-gray-200 bg-white p-5"
            >
              <h2 className="text-base font-semibold text-gray-900">{workflow.title}</h2>
              <div className="mt-2">
                <span
                  className={`inline-flex rounded px-2 py-0.5 text-[11px] font-medium ${
                    workflow.siteCommandParity === "Supported"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {workflow.siteCommandParity}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{workflow.summary}</p>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-gray-700">
                {workflow.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              {workflow.procoreManualUrl && (
                <p className="mt-3 text-xs text-gray-500">
                  Reference manual:{" "}
                  <a
                    href={workflow.procoreManualUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-gray-700"
                  >
                    Procore tutorial
                  </a>
                </p>
              )}
              {workflow.note && (
                <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {workflow.note}
                </p>
              )}
              <div className="mt-4">
                <Link
                  href={workflow.ctaPath.replace(":projectId", projectId)}
                  className="inline-flex rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {workflow.ctaLabel}
                </Link>
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
