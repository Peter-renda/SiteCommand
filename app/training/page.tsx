import { redirect } from "next/navigation";

export default function TrainingPage() {
  // The Training section opens on its first tree node: Training Modules (the
  // read-and-quiz curriculum), not the Practice simulation launcher.
  redirect("/training/lessons");
}
