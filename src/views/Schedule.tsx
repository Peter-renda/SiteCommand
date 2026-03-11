import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ProjectNav from "../components/ProjectNav";
export default function Schedule() {
  const { id } = useParams();
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/projects/${id}/schedule`)
      .then((res) => res.json())
      .then((data) => {
        setSchedule(data);
        setLoading(false);
      });
  }, [id]);
  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectNav projectId={id!} />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Schedule</h1>
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
            {schedule?.schedule ? (
              <p className="text-sm text-gray-700">Schedule file: <span className="font-medium">{schedule.schedule.filename}</span></p>
            ) : (
              <p className="text-sm text-gray-400">No schedule uploaded yet.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
