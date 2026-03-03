import Navbar from "../components/Navbar";

const caseStudies = [
  {
    company: "Meridian Construction",
    industry: "Construction",
    result: "Reduced document turnaround time by 60%",
    summary:
      "Meridian moved their entire RFI and submittal workflow into SiteCommand, cutting back-and-forth emails and giving their project managers real-time visibility across 12 active job sites.",
    tag: "Operations",
  },
  {
    company: "Vantage Properties",
    industry: "Real Estate",
    result: "Manages 80+ sites from one dashboard",
    summary:
      "Vantage used to rely on spreadsheets and weekly calls to track their portfolio. SiteCommand gave them a live view of every property, with automated reporting that saves their team 10 hours a week.",
    tag: "Portfolio Management",
  },
  {
    company: "Northgate Engineering",
    industry: "Engineering",
    result: "Improved compliance tracking across all projects",
    summary:
      "With strict regulatory requirements, Northgate needed a system they could trust. SiteCommand's document management and audit trails gave their compliance team exactly what they needed.",
    tag: "Compliance",
  },
  {
    company: "Clearwater Developments",
    industry: "Development",
    result: "Cut project handover time from weeks to days",
    summary:
      "Clearwater struggled with disorganized handover packages that caused delays at every project close. SiteCommand standardized the process and made closeouts fast, consistent, and painless.",
    tag: "Project Closeout",
  },
  {
    company: "Atlas Infrastructure",
    industry: "Infrastructure",
    result: "Unified 5 regional teams on one platform",
    summary:
      "Atlas had different teams using different tools in different regions. SiteCommand gave them a single source of truth — so everyone, everywhere, is always working from the same page.",
    tag: "Team Alignment",
  },
  {
    company: "Solana Contractors",
    industry: "Contracting",
    result: "Saved $120K annually in admin overhead",
    summary:
      "By automating their change order and budget tracking workflows, Solana reduced administrative headcount and redirected that capacity toward higher-value work.",
    tag: "Cost Savings",
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 text-center">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-4">
          Case Studies
        </p>
        <h1 className="text-5xl font-semibold tracking-tight text-gray-900 max-w-2xl mx-auto">
          Real teams. Real results.
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto">
          See how companies across industries use SiteCommand to move faster,
          stay organized, and get more done.
        </p>
      </section>

      {/* Case study grid */}
      <section className="py-12 px-6 pb-24">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {caseStudies.map((cs) => (
            <div
              key={cs.company}
              className="border border-gray-100 rounded-xl p-8 flex flex-col hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div className="mb-auto">
                <span className="inline-block text-xs font-medium text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-3 py-1 mb-4">
                  {cs.tag}
                </span>
                <h3 className="text-base font-semibold text-gray-900">{cs.company}</h3>
                <p className="text-xs text-gray-400 mt-0.5 mb-4">{cs.industry}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{cs.summary}</p>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{cs.result}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gray-900 text-center">
        <h2 className="text-3xl font-semibold text-white tracking-tight">
          Your story starts here
        </h2>
        <p className="mt-4 text-gray-400 max-w-md mx-auto">
          Join the teams already transforming how they manage their sites with
          SiteCommand.
        </p>
        <a
          href="/signup"
          className="mt-8 inline-block px-6 py-3 text-sm font-medium text-gray-900 bg-white rounded-md hover:bg-gray-100 transition-colors"
        >
          Get started free
        </a>
      </section>
    </div>
  );
}
