# Project Simulation Competency Test Ideas

This backlog lists practical ways to test at least two competencies in each project-manager category inside the training simulation. The examples are intentionally framed as simulation events: emails, meetings, tasks, document reviews, pay app reviews, and field issues that can be planted and scored.

## Implementation Status

These ideas now have active runtime coverage in the PM training simulation. Each category is represented by two planted inbox prompts in `lib/training-inbox.ts` and two corresponding `TRAINING_SCENARIOS` grading entries in `lib/training-scenarios.ts`. When a trainee replies in the project inbox or creates a matching task before the deadline, the existing scenario engine evaluates the evidence, writes a scenario outcome, and rolls the result into the competency profile.

The prompts below remain the human-readable authoring backlog, while the active checks live in code so the simulation can actually test the user.

## 1. Contract Administration

- **Owner contract risk email:** Send an email from the executive sponsor with three excerpts from the owner contract, including a no-damages-for-delay clause and a strict notice period. Ask the trainee to identify risks, draft a response, and create follow-up tasks for notice compliance.
- **Subcontract redline task:** Give the trainee a subcontract agreement with an excluded scope, mismatched insurance limit, and pay-if-paid language. Score whether they flag the gaps, request revised language, and document the negotiation.
- **Notice requirement checkpoint:** Trigger a weather-delay event and require the trainee to send timely contractual notice with the right recipients, facts, and reservation of rights.

## 2. Cost Management

- **Budget setup exercise:** Present an estimate and a blank project budget. Ask the trainee to create cost codes, allocate contingency, and map major scopes to the right budget lines.
- **Monthly cost report email:** Have accounting send committed costs, approved changes, pending exposure, and actuals. Ask the trainee to forecast EAC, explain variances, and recommend contingency moves.
- **Allowance draw decision:** Send an owner-selected finish upgrade against an allowance and score whether the trainee updates allowance balance, pending change exposure, and owner contingency.

## 3. Estimating / Buyout

- **Bid leveling meeting:** Run a buyout meeting where three bids carry different exclusions, alternates, and schedule assumptions. Score whether the trainee levels bids, identifies scope gaps, and recommends award.
- **Quantity takeoff challenge:** Provide a drawing excerpt or room schedule with a scope quantity mismatch. Ask the trainee to calculate quantities and challenge a bidder's number.
- **Value engineering request:** Have the owner request savings after GMP review. Score whether the trainee suggests realistic VE options with cost, schedule, quality, and risk tradeoffs.

## 4. Scheduling

- **Critical path review:** Send a CPM narrative and activity list with a delayed long-lead item. Ask the trainee to identify the critical path, affected milestones, and float consumption.
- **Two-week look-ahead task:** Ask the trainee to build a look-ahead from current field status, sequencing constraints, inspections, and material deliveries.
- **Recovery plan email:** Trigger a framing delay and score whether the trainee proposes resequencing, crew loading, overtime, and owner/sub notification.

## 5. Procurement

- **Procurement log creation:** Give the trainee a submittal register and schedule milestones. Ask them to create a procurement log with release dates, lead times, fabrication dates, and delivery dates.
- **Long-lead release email:** Send a vendor quote with a price-hold expiration and fabrication slot. Score whether the trainee releases, escalates, or creates a task before the deadline.
- **Owner-furnished material risk:** Have the owner delay appliance selections. Score whether the trainee identifies schedule impact, requests decision dates, and tracks OFCI delivery risk.

## 6. Submittals

- **Submittal log gap:** Present a spec section and an incomplete submittal log. Ask the trainee to add missing required submittals and assign due dates based on procurement need.
- **Architect review delay:** Send notice that an overdue door hardware submittal is blocking fabrication. Score whether the trainee expedites architect review and communicates impact.
- **Resubmittal decision:** Return a submittal as revise-and-resubmit with comments. Ask the trainee to route it to the sub, track status, and prevent field release until approval.

## 7. RFIs

- **Design conflict RFI:** Show a drawing conflict between structural beam depth and duct routing. Ask the trainee to write a clear RFI with location, references, proposed solution, and required response date.
- **Overdue RFI escalation:** Plant an RFI response delay that will stop layout work. Score whether the trainee escalates to the architect/consultant and communicates the field impact.
- **Response distribution test:** After an RFI answer changes a detail, score whether the trainee distributes the response to affected subs and updates related drawings/tasks.

## 8. Change Management

- **PCO creation from owner request:** Send an owner email requesting EV chargers or upgraded finishes. Score whether the trainee opens a PCO, gathers pricing, and tracks schedule impact.
- **Subcontractor change pricing review:** Provide a subcontractor COR with inflated labor hours, duplicated equipment, and missing backup. Ask the trainee to negotiate and document a fair value.
- **Owner COR package:** Ask the trainee to convert approved pricing into an owner-facing COR with scope, cost, backup, schedule impact, and exclusions.

## 9. Billing

- **Owner pay application review:** Provide percent-complete data, stored material backup, retainage rules, and previous billing. Ask the trainee to prepare or validate an owner pay application.
- **Subcontractor pay app challenge:** Send a sub pay app that overbills stored materials and includes work not installed. Score whether the trainee corrects it and requests lien waivers.
- **Collections follow-up:** Have the owner miss a payment date. Score whether the trainee follows up professionally while referencing payment terms and cash-flow impact.

## 10. Quality Control

- **QC plan task:** Ask the trainee to create a QC plan for concrete slab placement, including pre-pour checklist, inspections, testing, acceptance criteria, and documentation.
- **Failed inspection event:** Send a failed waterproofing inspection report. Score whether the trainee logs deficiencies, assigns corrective action, verifies reinspection, and updates affected work.
- **Punch list photo review:** Provide punch photos with duplicates and incomplete items. Ask the trainee to organize, assign, and verify closeout of punch list deficiencies.

## 11. Safety Support

- **Subcontractor safety plan review:** Send a fall-protection plan with missing competent-person information and incomplete rescue procedure. Ask the trainee to flag deficiencies before work starts.
- **Incident documentation email:** Trigger a minor injury or near-miss. Score whether the trainee coordinates incident report, OSHA log needs, witness statements, and corrective actions.
- **Safety meeting agenda:** Ask the trainee to prepare a safety meeting agenda around an upcoming high-risk activity such as crane pick, excavation, or hot work.

## 12. Meetings

- **Owner meeting simulation:** Run an owner meeting where cost, schedule, and decision issues surface. Score whether the trainee keeps agenda discipline, communicates risks, and captures commitments.
- **Subcontractor coordination meeting:** Have multiple subs argue over sequence and access. Score whether the trainee resolves conflicts, assigns action items, and publishes minutes.
- **OAC minutes review:** Provide raw meeting notes and ask the trainee to publish accurate minutes with decisions, open items, responsible parties, and due dates.

## 13. Document Control

- **Drawing revision distribution:** Issue a revised drawing set with clouded changes. Score whether the trainee updates the drawing log, notifies affected trades, and supersedes outdated sheets.
- **Specification log update:** Send an addendum that changes product requirements. Ask the trainee to update the spec log and identify impacted submittals, procurement, and scopes.
- **Archive request:** At phase close, ask the trainee to assemble contract correspondence, RFIs, submittals, drawings, and change files into a complete archive.

## 14. Coordination

- **Owner decision log email:** Send unresolved finish and equipment selections. Score whether the trainee creates decision deadlines tied to procurement and schedule milestones.
- **Utility coordination scenario:** Have the utility company request load letters, easement information, and transformer-pad readiness dates. Score whether the trainee coordinates engineer, owner, and field responses.
- **AHJ inspection sequencing:** Plant a conflict between fire marshal acceptance, elevator inspection, and certificate-of-occupancy target. Score whether the trainee sequences agencies correctly.

## 15. Financial Reporting

- **WIP report exercise:** Provide contract value, costs to date, committed cost, billed-to-date, and forecast. Ask the trainee to prepare WIP entries and explain over/underbilling.
- **Project health memo:** Ask the trainee to brief executives monthly on margin, cash, schedule, pending changes, risk exposure, and top decisions needed.
- **Earned revenue check:** Present percent-complete and cost data that conflict. Score whether the trainee identifies revenue recognition concerns and adjusts forecast assumptions.

## 16. Risk Management

- **Risk register update:** Start the simulation with known cost, schedule, procurement, safety, and design risks. Ask the trainee to maintain probability, impact, owner, mitigation, and status.
- **Unresolved issue escalation:** Plant a repeated unanswered design question. Score whether the trainee escalates, documents impacts, and protects contractual rights.
- **Claim documentation package:** Trigger a delay event and ask the trainee to assemble notices, daily reports, photos, schedule updates, cost records, and correspondence.

## 17. Field Support

- **Superintendent question:** Send a field question about whether to proceed with layout despite a drawing conflict. Score whether the trainee gives clear direction and uses RFI/submittal controls.
- **Constructability issue:** Plant a clash between slab sleeve locations and structural reinforcement. Score whether the trainee coordinates design, trade input, and field sequence before work is buried.
- **Manpower roadblock:** Have the superintendent report a trade is under-manned. Score whether the trainee contacts the sub, documents recovery commitments, and evaluates schedule impact.

## 18. Closeout

- **Punch completion tracker:** Ask the trainee to build a punch list plan with owners, due dates, verification steps, and client walk-through readiness.
- **O&M/warranty collection:** Send partial closeout documents with missing warranties and wrong O&M manuals. Score whether the trainee rejects incomplete packages and tracks resubmittal.
- **CO readiness scenario:** Have the building department identify final inspection prerequisites. Score whether the trainee coordinates life-safety, testing, elevator, utilities, and documentation needed for Certificate of Occupancy.

## 19. Technology

- **Procore-style workflow task:** Ask the trainee to create an RFI, distribute a response, update ball-in-court, and link it to drawings/submittals in the simulation tools.
- **Bluebeam/PDF markup challenge:** Provide a marked-up PDF or drawing snippet and ask the trainee to identify changes, create a punch item or RFI, and route the markup.
- **Excel cost analysis:** Give a small cost dataset and ask the trainee to use formulas, filters, pivots, or variance calculations to summarize budget risk.

## 20. Leadership

- **Subcontractor conflict role-play:** Run a meeting where two subs blame each other for a delay. Score whether the trainee de-escalates, clarifies facts, assigns actions, and preserves relationships.
- **Delegation scenario:** Overload the trainee with simultaneous pay app, RFI, meeting, and procurement deadlines. Score whether they prioritize and delegate appropriate tasks to a PE/APM.
- **Decision under uncertainty:** Present incomplete cost and schedule information before a release deadline. Score whether the trainee makes a reasoned recommendation, documents assumptions, and communicates risk.
