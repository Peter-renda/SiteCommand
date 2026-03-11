import { useParams } from "react-router-dom";
import ProjectNav from "../components/ProjectNav";
export default function Reporting() {
  const { id } = useParams();
  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectNav projectId={id!} />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Reporting</h1>
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
          <p className="text-sm text-gray-400">Reporting features are being ported to the new architecture.</p>
        </div>
      </main>
    </div>
  );
}
