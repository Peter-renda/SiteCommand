"use client";

import { useState } from "react";
import Link from "next/link";

export default function DemoPage() {
  const [code, setCode] = useState("sitecommand-demo");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Invalid access code");
      return;
    }

    window.location.href = data.redirect ?? "/dashboard";
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="mb-8">
          <Link href="/" className="inline-block">
            <span className="text-xl font-bold text-gray-900 tracking-tight">SiteCommand</span>
          </Link>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Explore the Demo</h1>
        <p className="text-sm text-gray-500 mb-8">
          Get instant access to a fully loaded demo project — no sign-up required. Enter the access
          code below to explore SiteCommand&apos;s project management tools.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Demo Access Code
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono"
              placeholder="sitecommand-demo"
              autoComplete="off"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Entering demo..." : "Enter Demo"}
          </button>
        </form>

        <p className="mt-6 text-xs text-gray-400">
          Want your own account?{" "}
          <Link href="/pricing" className="text-gray-600 font-medium hover:underline">
            View plans
          </Link>{" "}
          or{" "}
          <Link href="/" className="text-gray-600 font-medium hover:underline">
            go back home
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
