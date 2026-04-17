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
    siteCommandParity: "Supported",
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
    siteCommandParity: "Partially Supported",
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
    siteCommandParity: "Supported",
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
      "Open Bulk Actions > Add to Unapproved Prime PCO.",
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
      "Open Bulk Actions > Add to Unapproved Prime PCO.",
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
  {
    title: "Add a Change Event Line Item to an Unapproved Commitment CO",
    summary:
      "From Change Events, move selected line items directly into an existing unapproved commitment change order.",
    steps: [
      "Select one or more change event line items (across one or more change events).",
      "Open Bulk Actions > Add to Unapproved Commitment CO.",
      "Choose an unapproved CCO from the submenu.",
      "Review the updated CCO schedule of values and complete approval workflow.",
    ],
    procoreManualUrl:
      "https://v2.support.procore.com/product-manuals/change-events-project/tutorials/add-a-change-event-line-item-to-an-unapproved-commitment-co/",
    siteCommandParity: "Supported",
    note:
      "Selected cost ROM values are appended as Schedule of Values lines and linked source change event metadata is preserved.",
    ctaPath: "/projects/:projectId/change-events",
    ctaLabel: "Open Change Events",
  },
  {
    title: "Create a Commitment Potential Change Order from a Change Event",
    summary:
      "Use Bulk Actions to add selected line items into an unapproved commitment-side potential change order.",
    steps: [
      "Select one or more change event line items in Change Events.",
      "Open Bulk Actions > Add to Unapproved Commitment.",
      "Pick the target unapproved commitment record.",
      "Continue drafting and convert to downstream change-order stages based on your tier settings.",
    ],
    procoreManualUrl:
      "https://v2.support.procore.com/product-manuals/change-events-project/tutorials/create-a-commitment-potential-change-order-from-a-change-event/",
    siteCommandParity: "Supported",
    note:
      "For two-tier workflows, this maps to CE > CPCO > CCO. RFQ timing can affect populated amounts.",
    ctaPath: "/projects/:projectId/change-events",
    ctaLabel: "Open Change Events",
  },
  {
    title: "Bulk Create Commitment Change Orders from a Change Event",
    summary:
      "Create vendor-specific commitment change order records from selected change event line items.",
    steps: [
      "Select line items from one or multiple change events.",
      "Use Bulk Actions to create commitment-side records by commitment target.",
      "Open each generated CCO/CPCO and validate amounts, SOV, and reviewer assignment.",
      "Advance status through your project's approval sequence.",
    ],
    procoreManualUrl:
      "https://v2.support.procore.com/product-manuals/change-events-project/tutorials/bulk-create-commitment-change-orders-from-a-change-event/",
    siteCommandParity: "Partially Supported",
    note:
      "SiteCommand supports multi-select creation flows, but does not yet mirror Procore's vendor-grouped bulk-create confirmation screen one-to-one.",
    ctaPath: "/projects/:projectId/change-events",
    ctaLabel: "Open Change Events",
  },
  {
    title: "Create a Commitment Change Order (CCO)",
    summary:
      "Create commitment change orders from the commitment workflow and complete required financial fields before routing.",
    steps: [
      "Open the target commitment and start a new change order.",
      "Fill general fields, schedule of values, amount, and reviewer assignment.",
      "Save as draft or move to pending review when ready for response.",
    ],
    procoreManualUrl:
      "https://v2.support.procore.com/product-manuals/commitments-project/tutorials/create-a-commitment-change-order-cco/",
    siteCommandParity: "Supported",
    ctaPath: "/projects/:projectId/commitments",
    ctaLabel: "Open Commitments",
  },
  {
    title: "Add Financial Markup to CCOs",
    summary:
      "Configure financial markup rules on commitment change orders where project settings allow markup.",
    steps: [
      "Open a commitment with markup enabled.",
      "Create or edit a CCO and add markup rules.",
      "Review horizontal/vertical markup impact before finalizing.",
    ],
    procoreManualUrl:
      "https://v2.support.procore.com/product-manuals/commitments-project/tutorials/add-financial-markup-to-ccos/",
    siteCommandParity: "Supported",
    note:
      "After markup is applied, that CCO should not be used on subcontractor invoices.",
    ctaPath: "/projects/:projectId/commitments/settings",
    ctaLabel: "Open Commitment Settings",
  },
  {
    title: "Approve or Reject Commitment Change Orders",
    summary:
      "Designated reviewers can approve or reject CCOs that are in a pending review status.",
    steps: [
      "Open the CCO assigned to you as designated reviewer.",
      "Review details and choose Approve or Reject.",
      "Confirm reviewer and review date are captured.",
    ],
    procoreManualUrl:
      "https://v2.support.procore.com/product-manuals/change-orders-project/tutorials/approve-or-reject-commitment-change-orders/",
    siteCommandParity: "Supported",
    ctaPath: "/projects/:projectId/change-orders",
    ctaLabel: "Open Change Orders",
  },
  {
    title: "Complete a CCO with DocuSign",
    summary:
      "Route CCO signatures through DocuSign when contract and integration settings are enabled.",
    steps: [
      "Ensure DocuSign integration is enabled and signer data is configured.",
      "Open the commitment/CCO and start the DocuSign completion flow.",
      "Prepare recipients and send envelope for signature.",
    ],
    procoreManualUrl:
      "https://v2.support.procore.com/product-manuals/commitments-project/tutorials/complete-a-commitment-change-order-cco-with-docusign/",
    siteCommandParity: "Partially Supported",
    note:
      "SiteCommand supports DocuSign enablement and contract-level completion flows; envelope setup details may vary from Procore's native UI.",
    ctaPath: "/projects/:projectId/commitments",
    ctaLabel: "Open Commitments",
  },
  {
    title: "Add a Related Item to a Commitment Change Order",
    summary:
      "Link supporting project objects to improve auditability and context on a commitment change order.",
    steps: [
      "Open the change order detail record.",
      "Use related-item linking to connect upstream/downstream records.",
      "Save and validate related references before routing approvals.",
    ],
    procoreManualUrl:
      "https://v2.support.procore.com/product-manuals/change-orders-project/tutorials/add-a-related-item-to-a-commitment-change-order/",
    siteCommandParity: "Partially Supported",
    note:
      "Related Items parity is currently strongest in Change Events; commitment CO-specific related-item controls are planned for expanded alignment.",
    ctaPath: "/projects/:projectId/change-orders",
    ctaLabel: "Open Change Orders",
  },
  {
    title: "Determine the Order in Which Change Orders Were Approved",
    summary:
      "Use approval status and timestamps to identify the most recently approved change orders when backtracking changes.",
    steps: [
      "Open the parent contract/commitment and review approved change orders.",
      "Sort by status/date to identify the most recently approved sequence.",
      "If a prior approved CO needs edits, roll statuses back in reverse approval order.",
    ],
    procoreManualUrl:
      "https://v2.support.procore.com/product-manuals/change-orders-project/tutorials/determine-the-order-in-which-change-orders-were-approved/",
    siteCommandParity: "Supported",
    ctaPath: "/projects/:projectId/change-orders",
    ctaLabel: "Open Change Orders",
  },
  {
    title: "Forward a Change Order to a Project User by Email",
    summary:
      "Notify reviewers and stakeholders by forwarding commitment or prime change orders through project email workflows.",
    steps: [
      "Open the change order to distribute.",
      "Use the forward/email action to choose recipients from the project directory.",
      "Send with context about required review or action.",
    ],
    procoreManualUrl:
      "https://v2.support.procore.com/product-manuals/change-orders-project/tutorials/forward-a-change-order-to-a-project-user-by-email/",
    siteCommandParity: "Partially Supported",
    note:
      "Prime CO forwarding has dedicated UI. Commitment CO email-forwarding parity remains in-progress.",
    ctaPath: "/projects/:projectId/change-orders",
    ctaLabel: "Open Change Orders",
  },
  {
    title: "Budget Changes + Owner Invoices",
    summary:
      "Use budget changes when a financial adjustment does not require a prime contract change order, then optionally add approved changes to the latest owner invoice.",
    steps: [
      "Create and review budget changes in the Budget tool.",
      "Use Financial Impact workflows to keep change events linked when needed.",
      "After approval, mark the budget changes that should flow to the owner invoice.",
      "Update billable values from grouped budget-change lines on the owner invoice.",
    ],
    procoreManualUrl:
      "https://v2.support.procore.com/process-guides/about-budget-changes-on-owner-invoices/",
    siteCommandParity: "Partially Supported",
    note:
      "Best fit for GMP/allowance-contingency scenarios where the owner needs visibility without a full PCCO for each adjustment.",
    ctaPath: "/projects/:projectId/budget",
    ctaLabel: "Open Budget",
  },
  {
    title: "Budget + Forecast Snapshots",
    summary:
      "Capture point-in-time budget and forecast states for variance analysis, export, and historical comparisons.",
    steps: [
      "Create a snapshot from the project budget workflow.",
      "View and compare snapshot values against the current budget state.",
      "Analyze variance by key financial columns.",
      "Export snapshots and snapshot lists for distribution or archive.",
    ],
    procoreManualUrl:
      "https://v2.support.procore.com/process-guides/budget-and-forecast-snapshots-user-guide/",
    siteCommandParity: "Partially Supported",
    note:
      "Use snapshots for review gates (monthly close, forecast lock, owner update) so change discussions are based on a stable baseline.",
    ctaPath: "/projects/:projectId/budget",
    ctaLabel: "Open Budget",
  },
  {
    title: "Company WBS Setup",
    summary:
      "Align company-level cost structure with custom segments, segment items, and budget code structure settings before project teams begin cost tracking.",
    steps: [
      "Define custom segments and segment items for your company standard.",
      "Configure default cost code and cost type segments (including units of measure).",
      "Enable optional sub jobs and budget code structure controls.",
      "Roll out project-level usage once segment governance is stable.",
    ],
    procoreManualUrl:
      "https://v2.support.procore.com/process-guides/company-administration-work-breakdown-structure-guide/",
    siteCommandParity: "Partially Supported",
    note:
      "WBS governance lives at the company admin level; project financial accuracy depends on this setup.",
    ctaPath: "/company",
    ctaLabel: "Open Company Admin",
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
