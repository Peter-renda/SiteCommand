"use client";

import { useState, useEffect, use } from "react";

type InviteData = {
  email: string;
  companyName: string;
  invitationType: "internal" | "external";
  projectName: string | null;
  hasAccount: boolean;
};

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteData, setInviteData] = useState<InviteData | null>(null);

  // Toggle between new account and existing account
  const [useExisting, setUseExisting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
          // Auto-switch to existing account flow if they already have one
          if (data.hasAccount) setUseExisting(true);
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

    if (!useExisting) {
      if (password !== confirmPassword) {
        setFormError("Passwords do not match");
        return;
      }
      if (password.length < 6) {
        setFormError("Password must be at least 6 characters");
        return;
      }
    }

    setSubmitting(true);
    setFormError("");

    const body: Record<string, unknown> = { password, existingAccount: useExisting };
    if (!useExisting) {
      body.firstName = firstName;
      body.lastName = lastName;
    }

    const res = await fetch(`/api/invite/${token}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setFormError(data.error || "Failed to accept invitation");
      return;
    }

    window.location.href = data.redirect ?? "/dashboard";
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
        </div>

        {/* Account mode toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-5 text-sm">
          <button
            type="button"
            onClick={() => { setUseExisting(false); setFormError(""); }}
            className={`flex-1 py-2 font-medium transition-colors ${!useExisting ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:text-gray-900"}`}
          >
            Create account
          </button>
          <button
            type="button"
            onClick={() => { setUseExisting(true); setFormError(""); }}
            className={`flex-1 py-2 font-medium transition-colors ${useExisting ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:text-gray-900"}`}
          >
            Sign in
          </button>
        </div>

        {inviteData?.hasAccount && !useExisting && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-md px-3 py-2 mb-4">
            An account already exists for <strong>{inviteData.email}</strong>. Sign in to link it to this invitation.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!useExisting && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Last name"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={inviteData?.email ?? ""}
              readOnly
              className="w-full px-3 py-2 border border-gray-100 rounded-md text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {!useExisting && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                value={inviteData?.companyName ?? ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-100 rounded-md text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder={useExisting ? "Your SiteCommand password" : "At least 6 characters"}
            />
          </div>

          {!useExisting && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Re-enter password"
              />
            </div>
          )}

          {formError && <p className="text-xs text-red-600">{formError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {submitting
              ? useExisting ? "Signing in..." : "Creating account..."
              : useExisting ? "Sign in & accept invite" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
