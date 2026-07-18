import SkillsClient from "./SkillsClient";

export const metadata = { title: "Skills & Credential – SiteCommand" };

// Session gating happens in the Training layout; the client fetches the
// live competency profile itself.
export default function SkillsPage() {
  return <SkillsClient />;
}
