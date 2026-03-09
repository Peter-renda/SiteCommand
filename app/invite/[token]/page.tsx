"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

type InviteData = {
  email: string;
  companyName: string;
  invitationType: "internal" | "external";
  projectName: string | null;
};

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteData, setInviteData] = useState<InviteData | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Invalid invitation");
        } else {
          const data = await res.json();
          setInviteData(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load invitation");
        setLoading(false);
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    setFormError("");

    const res = await fetch(`/api/invite/${token}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setFormError(data.error || "Failed to create account");
      return;
    }

    router.push(data.redirect ?? "/dashboard");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <a href="/login" className="text-sm text-gray-500 hover:text-gray-900">
            Go to login
          </a>
        </div>
      </div>
    );
  }

  const isExternal = inviteData?.invitationType === "external";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          {isExternal ? (
            <>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">
                You&apos;ve been invited to collaborate
              </h1>
              <p className="text-sm text-gray-500">
                <strong>{inviteData?.companyName}</strong> has invited you to view{" "}
                {inviteData?.projectName ? (
                  <>the project <strong>{inviteData.projectName}</strong></>
                ) : (
                  "a project"
                )}{" "}
                on SiteCommand.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                As an external collaborator you can view project content but cannot create projects
                or access other company data.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">
                Join {inviteData?.companyName}
              </h1>
              <p className="text-sm text-gray-500">
                You&apos;ve been invited to join <strong>{inviteData?.companyName}</strong> on
                SiteCommand.
              </p>
            </>
          )}
          <p className="text-xs text-gray-400 mt-2">Signing up as: {inviteData?.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Choose a username"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="At least 6 characters"
            />
          </div>

          {formError && <p className="text-xs text-red-600">{formError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
