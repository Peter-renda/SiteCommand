import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ProjectNav from "../components/ProjectNav";

type LocalPhoto = {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  album: string;
  comments: string;
  uploadedAt: string;
  uploadedBy: string;
};

type ProjectAlbum = {
  id: string;
  name: string;
};

export default function DailyLog() {
  const { id } = useParams();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [log, setLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [photoPage, setPhotoPage] = useState(1);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [albumOptions, setAlbumOptions] = useState<ProjectAlbum[]>([]);
  const photosPerPage = 1;

  const photoPageCount = Math.max(1, Math.ceil(photos.length / photosPerPage));
  const currentPhotoPage = Math.min(photoPage, photoPageCount);
  const displayedPhoto = photos[(currentPhotoPage - 1) * photosPerPage];

  useEffect(() => {
    setLoading(true);
    fetch(`/api/projects/${id}/daily-log?date=${date}`)
      .then((res) => res.json())
      .then((data) => {
      setLog(data);
      setLoading(false);
      });
  }, [id, date]);

  useEffect(() => {
    fetch(`/api/projects/${id}/photo-albums`)
      .then((res) => (res.ok ? res.json() : []))
      .then((albums: ProjectAlbum[]) => {
        setAlbumOptions(Array.isArray(albums) ? albums : []);
      })
      .catch(() => {});
  }, [id]);

  async function handleSave() {
    const res = await fetch(`/api/projects/${id}/daily-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        log_date: date,
        weather_conditions: log?.weather_conditions,
        weather_temp: log?.weather_temp,
        weather_wind: log?.weather_wind,
        weather_humidity: log?.weather_humidity,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setLog(data);
    }
  }

  function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) {
      return;
    }
    const now = new Date().toISOString();
    const uploadedBy = "Project User";
    const nextPhotos = selectedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      title: "",
      album: "",
      comments: "",
      uploadedAt: now,
      uploadedBy,
    }));
    setPhotos((currentPhotos) => [...currentPhotos, ...nextPhotos]);
    event.target.value = "";
  }

  function goToNextPhoto() {
    setPhotoPage((current) => Math.min(current + 1, photoPageCount));
  }

  function goToPreviousPhoto() {
    setPhotoPage((current) => Math.max(current - 1, 1));
  }

  function updatePhoto(id: string, patch: Partial<LocalPhoto>) {
    setPhotos((current) => current.map((photo) => (photo.id === id ? { ...photo, ...patch } : photo)));
  }

  function goToPreviousPreview() {
    setPreviewIndex((current) => {
      if (current === null || photos.length === 0) return current;
      return current === 0 ? photos.length - 1 : current - 1;
    });
  }

  function goToNextPreview() {
    setPreviewIndex((current) => {
      if (current === null || photos.length === 0) return current;
      return current === photos.length - 1 ? 0 : current + 1;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectNav projectId={id!} />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Daily Log</h1>
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
            >
              Save Log
            </button>
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Weather</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Conditions</label>
                  <input
                    type="text"
                    value={log?.weather_conditions || ""}
                    onChange={(e) => setLog({ ...log, weather_conditions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="Clear, Rain, etc."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Temp</label>
                  <input
                    type="text"
                    value={log?.weather_temp || ""}
                    onChange={(e) => setLog({ ...log, weather_temp: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="72°F"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Wind</label>
                  <input
                    type="text"
                    value={log?.weather_wind || ""}
                    onChange={(e) => setLog({ ...log, weather_wind: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="5mph NW"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Humidity</label>
                  <input
                    type="text"
                    value={log?.weather_humidity || ""}
                    onChange={(e) => setLog({ ...log, weather_humidity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="45%"
                  />
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Work Summary</h2>
              <p className="text-sm text-gray-400 italic">Sections for Manpower, Deliveries, and Inspections coming soon in this ported version.</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-2xl font-semibold text-gray-900">Photos</h2>
              </div>
              <div className="flex items-center gap-6 text-gray-500 text-2xl mb-4">
                <span className="italic text-xl">
                  {photos.length === 0 ? "0-0 of 0" : `${currentPhotoPage}-${currentPhotoPage} of ${photos.length}`}
                </span>
                <span className="text-gray-700 not-italic">Page:</span>
                <span className="text-gray-700 not-italic">{currentPhotoPage}</span>
                <button
                  type="button"
                  onClick={goToPreviousPhoto}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
                  disabled={currentPhotoPage <= 1}
                  aria-label="Previous photo"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goToNextPhoto}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
                  disabled={currentPhotoPage >= photoPageCount || photos.length === 0}
                  aria-label="Next photo"
                >
                  ›
                </button>
              </div>
              <label className="w-40 h-40 border border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-orange-500 text-4xl font-semibold cursor-pointer hover:border-orange-300 transition-colors">
                {displayedPhoto ? (
                  <div
                    role="img"
                    aria-label={displayedPhoto.file.name}
                    className="w-full h-full bg-center bg-cover"
                    style={{ backgroundImage: `url(${displayedPhoto.previewUrl})` }}
                    onClick={() => setPreviewIndex((currentPhotoPage - 1) * photosPerPage)}
                  />
                ) : (
                  <>
                    <span className="leading-none">+</span>
                    <span className="text-3xl mt-3">Upload</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              <div className="flex items-center gap-6 text-gray-500 text-2xl mt-4">
                <span className="italic text-xl">
                  {photos.length === 0 ? "0-0 of 0" : `${currentPhotoPage}-${currentPhotoPage} of ${photos.length}`}
                </span>
                <span className="text-gray-700 not-italic">Page:</span>
                <span className="text-gray-700 not-italic">{currentPhotoPage}</span>
                <button
                  type="button"
                  onClick={goToPreviousPhoto}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
                  disabled={currentPhotoPage <= 1}
                  aria-label="Previous photo bottom"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goToNextPhoto}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
                  disabled={currentPhotoPage >= photoPageCount || photos.length === 0}
                  aria-label="Next photo bottom"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      {previewIndex !== null && photos[previewIndex] && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewIndex(null)}>
          <div className="max-w-[1200px] max-h-[88vh] w-full h-full flex items-stretch" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 min-w-0 flex items-center justify-center bg-black/40 rounded-l-lg">
              <img
                src={photos[previewIndex].previewUrl}
                alt={photos[previewIndex].title || photos[previewIndex].file.name}
                className="max-h-[82vh] w-auto max-w-full object-contain"
              />
            </div>
            <aside className="w-[320px] shrink-0 bg-[#111318] text-white rounded-r-lg border-l border-white/10 p-4 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-200">Information</h3>
              <p className="text-sm mt-3 font-medium">{photos[previewIndex].title || "No Description"}</p>
              <div className="mt-4 border-t border-white/15 pt-4 space-y-4 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1">Title</label>
                  <input
                    value={photos[previewIndex].title}
                    onChange={(e) => updatePhoto(photos[previewIndex].id, { title: e.target.value })}
                    className="w-full rounded border border-white/20 bg-black/20 px-2 py-1.5 text-sm text-white"
                  />
                </div>
                <div>
                  <p className="text-gray-400">Date Uploaded</p>
                  <p className="mt-1 text-sm">{new Date(photos[previewIndex].uploadedAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">Uploaded By</p>
                  <p className="mt-1 text-sm">{photos[previewIndex].uploadedBy}</p>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Album</label>
                  <select
                    value={photos[previewIndex].album}
                    onChange={(e) => updatePhoto(photos[previewIndex].id, { album: e.target.value })}
                    className="w-full rounded border border-white/20 bg-black/20 px-2 py-1.5 text-sm text-white"
                  >
                    <option value="">Unclassified</option>
                    {albumOptions.map((album) => (
                      <option key={album.id} value={album.name}>{album.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Comments</label>
                  <textarea
                    value={photos[previewIndex].comments}
                    onChange={(e) => updatePhoto(photos[previewIndex].id, { comments: e.target.value })}
                    rows={5}
                    className="w-full rounded border border-white/20 bg-black/20 px-2 py-1.5 text-sm text-white resize-y"
                  />
                </div>
              </div>
            </aside>
          </div>
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPreviousPreview();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/30"
                aria-label="Previous photo"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextPreview();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/30"
                aria-label="Next photo"
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
