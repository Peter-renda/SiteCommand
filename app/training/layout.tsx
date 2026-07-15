import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AppHeader from "@/app/components/AppHeader";
import TrainingNav from "./TrainingNav";

export default async function TrainingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader username={session.username} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row gap-6 sm:gap-8">
        <TrainingNav />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
