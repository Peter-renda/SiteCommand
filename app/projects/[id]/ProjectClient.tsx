"use client";

import { useState, useEffect, useRef } from "react";

type Member = { id: string; username: string; email: string };

type Project = {
  id: string;
  name: string;
  description: string;
  address: string;
  zip_code: string;
  value: number;
  status: string;
  created_at: string;
  photo_url: string | null;
  members: Member[];
};

type WeatherDay = {
  date: string;
  code: number;
  max: number;
  min: number;
};

function weatherInfo(code: number): { label: string; icon: string } {
  if (code === 0) return { label: "Clear", icon: "☀️" };
  if (code <= 3) return { label: "Partly cloudy", icon: "⛅" };
  if (code <= 48) return { label: "Foggy", icon: "🌫️" };
  if (code <= 55) return { label: "Drizzle", icon: "🌦️" };
  if (code <= 65) return { label: "Rain", icon: "🌧️" };
  if (code <= 75) return { label: "Snow", icon: "❄️" };
  if (code <= 82) return { label: "Showers", icon: "🌦️" };
  if (code <= 99) return { label: "Thunderstorm", icon: "⛈️" };
  return { label: "Unknown", icon: "🌡️" };
}

function WeatherWidget({ zipCode }: { zipCode: string }) {
  const [days, setDays] = useState<WeatherDay[]>([]);
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!zipCode) { setLoading(false); return; }

    async function fetchWeather() {
      try {
        const geoRes = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
        if (!geoRes.ok) { setError("Invalid ZIP code"); setLoading(false); return; }
        const geoData = await geoRes.json();
        const place = geoData.places[0];
        const lat = parseFloat(place.latitude);
        const lon = parseFloat(place.longitude);
        setLocation(`${place["place name"]}, ${place["state abbreviation"]}`);

        const wxRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&forecast_days=7`
        );
        const wxData = await wxRes.json();
        const { time, weathercode, temperature_2m_max, temperature_2m_min } = wxData.daily;
        setDays(time.map((date: string, i: number) => ({
          date,
          code: weathercode[i],
          max: Math.round(temperature_2m_max[i]),
          min: Math.round(temperature_2m_min[i]),
        })));
      } catch {
        setError("Failed to load weather");
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, [zipCode]);

  if (!zipCode) return <p className="text-xs text-gray-400">No ZIP code set for this project.</p>;
  if (loading) return <p className="text-xs text-gray-400">Loading weather...</p>;
  if (error) return <p className="text-xs text-red-400">{error}</p>;

  return (
    <div>
      {location && <p className="text-xs text-gray-400 mb-3">{location}</p>}
      <div className="space-y-1.5">
        {days.map((day) => {
          const { icon } = weatherInfo(day.code);
          const dayName = new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
          return (
            <div key={day.date} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg">
              <span className="text-xs font-medium text-gray-600 w-9">{dayName}</span>
              <span className="text-base">{icon}</span>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-gray-900">{day.max}°</span>
                <span className="text-gray-400">{day.min}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProjectClient({
  projectId,
  role,
  username,
}: {
  projectId: string;
  role: string;
  username: string;
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((res) => {
        if (!res.ok) { setNotFound(true); setLoading(false); return null; }
        return res.json();
      })
      .then((data) => {
        if (data) { setProject(data); setLoading(false); }
      });
  }, [projectId]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !project) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("photo", file);

    const res = await fetch(`/api/projects/${project.id}/photo`, { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);

    if (res.ok) {
      setProject((prev) => prev ? { ...prev, photo_url: data.photo_url + `?t=${Date.now()}` } : prev);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <a href="/dashboard" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">
          SiteCommand
        </a>
        <div className="flex items-center gap-5">
          {role === "admin" && (
            <a href="/admin" className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">Admin</a>
          )}
          <span className="text-sm text-gray-400">{username}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-900 transition-colors">Logout</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : notFound ? (
          <p className="text-sm text-gray-500">Project not found.</p>
        ) : project ? (
          <>
            {/* Back link */}
            <a href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-8">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              All Projects
            </a>

            {/* Centered project name + status */}
            <div className="text-center mb-10">
              <h1 className="text-3xl font-semibold text-gray-900">{project.name}</h1>
              <div className="flex items-center justify-center gap-3 mt-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${project.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {project.status}
                </span>
                <span className="text-sm font-semibold text-gray-900">${(project.value || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Left: Team */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-gray-100 rounded-xl p-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Project Team</h2>
                  {project.members.length === 0 ? (
                    <p className="text-sm text-gray-400">No team members assigned.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {project.members.map((m) => (
                        <div key={m.id} className="flex items-center gap-3 py-2.5 px-4 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                            {m.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{m.username}</p>
                            <p className="text-xs text-gray-400">{m.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Photo, Info, Weather */}
              <div className="space-y-5">

                {/* Photo */}
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  {project.photo_url ? (
                    <img src={project.photo_url} alt="Project photo" className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M4.5 19.5h15a.75.75 0 00.75-.75V6.75A.75.75 0 0019.5 6h-15a.75.75 0 00-.75.75v12c0 .414.336.75.75.75z" />
                      </svg>
                    </div>
                  )}
                  {role === "admin" && (
                    <div className="px-4 py-3 border-t border-gray-100">
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        {uploading ? "Uploading..." : project.photo_url ? "Change Photo" : "Add Photo"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Address & Description */}
                {(project.address || project.description) && (
                  <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
                    {project.address && (
                      <div className="flex items-start gap-2">
                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-sm text-gray-600">{project.address}{project.zip_code ? ` ${project.zip_code}` : ""}</p>
                      </div>
                    )}
                    {project.description && (
                      <p className="text-sm text-gray-500 leading-relaxed">{project.description}</p>
                    )}
                  </div>
                )}

                {/* Weather */}
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">7-Day Forecast</h2>
                  <WeatherWidget zipCode={project.zip_code} />
                </div>

              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
