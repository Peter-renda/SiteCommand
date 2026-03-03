import Navbar from "../components/Navbar";

const values = [
  {
    title: "Built for builders",
    description:
      "We design every feature with the people who build and manage websites in mind — not the other way around.",
  },
  {
    title: "Transparency first",
    description:
      "From our pricing to our roadmap, we keep our customers informed and in control.",
  },
  {
    title: "Reliability at scale",
    description:
      "Whether you manage one site or a thousand, SiteCommand is built to handle it without missing a beat.",
  },
  {
    title: "Customer obsessed",
    description:
      "We measure success by how much time and stress we save the people who trust us with their sites.",
  },
];

export default function CompanyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 text-center">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-4">
          Company
        </p>
        <h1 className="text-5xl font-semibold tracking-tight text-gray-900 max-w-2xl mx-auto">
          We&apos;re on a mission to simplify the web
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto">
          SiteCommand was founded to give teams a single, powerful place to manage
          every aspect of their web presence — without the chaos.
        </p>
      </section>

      {/* Mission */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
              Why we built SiteCommand
            </h2>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Managing a website — or dozens of them — used to mean juggling a dozen
              different tools, logins, and dashboards. We built SiteCommand to change
              that: one command center for everything your site needs.
            </p>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Today we help teams across industries move faster, stay organized, and
              ship confidently.
            </p>
          </div>
          <div className="rounded-2xl bg-gray-900 h-64 flex items-center justify-center">
            <span className="text-white text-2xl font-semibold tracking-tight opacity-60">
              SiteCommand
            </span>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-semibold text-gray-900 tracking-tight text-center mb-14">
            What we stand for
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {values.map((v) => (
              <div key={v.title} className="border border-gray-100 rounded-xl p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gray-900 text-center">
        <h2 className="text-3xl font-semibold text-white tracking-tight">
          Ready to take command?
        </h2>
        <p className="mt-4 text-gray-400 max-w-md mx-auto">
          Join the teams already running their sites with SiteCommand.
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
