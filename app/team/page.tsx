import Navbar from "../components/Navbar";

const team = [
  {
    name: "Alex Rivera",
    role: "Co-founder & CEO",
    bio: "Previously built developer tools at scale. Obsessed with simplifying complex workflows.",
  },
  {
    name: "Jordan Kim",
    role: "Co-founder & CTO",
    bio: "Infrastructure engineer at heart. Believes reliable software is a form of respect for users.",
  },
  {
    name: "Sam Patel",
    role: "Head of Design",
    bio: "Formerly at top product agencies. Turns complex problems into interfaces that just make sense.",
  },
  {
    name: "Morgan Ellis",
    role: "Head of Engineering",
    bio: "Full-stack generalist who has shipped products used by millions. Loves clean code and fast deploys.",
  },
  {
    name: "Taylor Brooks",
    role: "Head of Customer Success",
    bio: "Champions the customer in every conversation. Turns support tickets into product improvements.",
  },
  {
    name: "Casey Nguyen",
    role: "Head of Growth",
    bio: "Data-driven and creatively led. Has a knack for finding the stories inside the numbers.",
  },
];

function InitialAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("");
  return (
    <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold text-lg mb-4">
      {initials}
    </div>
  );
}

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 text-center">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-4">
          Team
        </p>
        <h1 className="text-5xl font-semibold tracking-tight text-gray-900 max-w-2xl mx-auto">
          The people behind SiteCommand
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto">
          A small team with big ambitions — united by a belief that managing websites
          should be simpler, faster, and less stressful.
        </p>
      </section>

      {/* Team grid */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member) => (
            <div
              key={member.name}
              className="border border-gray-100 rounded-xl p-8"
            >
              <InitialAvatar name={member.name} />
              <h3 className="text-base font-semibold text-gray-900">{member.name}</h3>
              <p className="text-sm text-gray-400 mt-0.5 mb-3">{member.role}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hiring CTA */}
      <section className="py-20 px-6 bg-gray-50 text-center">
        <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
          We&apos;re hiring
        </h2>
        <p className="mt-4 text-gray-500 max-w-md mx-auto">
          Think you belong here? We&apos;re always looking for curious, driven people
          who want to build something that matters.
        </p>
        <a
          href="#"
          className="mt-8 inline-block px-6 py-3 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
        >
          View open roles
        </a>
      </section>
    </div>
  );
}
