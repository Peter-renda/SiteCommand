import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ProjectNav from "../components/ProjectNav";
export default function DailyLog() {
  const { id } = useParams();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [log, setLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetch(`/api/projects/${id}/daily-log?date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        setLog(data);
        setLoading(false);
      });
  }, [id, date]);
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
          </div>
        )}
      </main>
    </div>
  );
}
