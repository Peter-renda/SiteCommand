import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ProjectNav from "../components/ProjectNav";
export default function Photos() {
  const { id } = useParams();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/projects/${id}/photos`)
      .then((res) => res.json())
      .then((data) => {
        setPhotos(data);
        setLoading(false);
      });
  }, [id]);
  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectNav projectId={id!} />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Photos</h1>
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : photos.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl py-16 text-center">
            <p className="text-sm text-gray-400">No photos yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((p) => (
              <div key={p.id} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                <img src={p.url} alt={p.filename} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
