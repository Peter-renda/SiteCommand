"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const inputStyle = {
  borderColor: "rgba(0,0,0,0.1)",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
} as const;

function ResetPasswordInner() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-6 py-12" style={{ background: "#FAFAF9" }}>
      <div className="w-full max-w-sm">
        <a href="/" className="inline-block mb-10">
          <span className="font-display text-lg text-gray-900">CPMA</span>
        </a>

        <div className="rounded-2xl" style={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(235,235,233,0.5) 100%)",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.7) inset",
          padding: "1.5px",
        }}>
          <div className="rounded-[14px] px-8 py-8" style={{ background: "#FFFFFF", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)" }}>
            {done ? (
              <>
                <h1 className="font-display text-2xl text-gray-950 mb-2">Password updated</h1>
                <p className="text-sm text-gray-500 leading-relaxed mb-8">
                  Your password has been reset. You can now sign in with your new password.
                </p>
                <Link
                  href="/login"
                  className="block w-full py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] text-center"
                  style={{ background: "#111110" }}
                >
                  Sign in
                </Link>
              </>
            ) : !token ? (
              <>
                <h1 className="font-display text-2xl text-gray-950 mb-2">Invalid reset link</h1>
                <p className="text-sm text-gray-500 leading-relaxed mb-8">
                  This link is missing its reset token. Request a new password reset to continue.
                </p>
                <Link
                  href="/forgot-password"
                  className="block w-full py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] text-center"
                  style={{ background: "#111110" }}
                >
                  Request a new link
                </Link>
              </>
            ) : (
              <>
                <h1 className="font-display text-2xl text-gray-950 mb-2">Set a new password</h1>
                <p className="text-sm text-gray-400 mb-8">Choose a password of at least 8 characters.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">New password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-900 bg-white transition-all focus:outline-none"
                      style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor = "#2563EB"}
                      onBlur={e => e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)"}
                      placeholder="Min. 8 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">Confirm password</label>
                    <input
                      type="password"
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-900 bg-white transition-all focus:outline-none"
                      style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor = "#2563EB"}
                      onBlur={e => e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)"}
                      placeholder="Repeat password"
                    />
                  </div>

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full py-3 px-4 rounded-xl text-sm font-semibold text-white overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50"
                    style={{ background: "#111110" }}
                  >
                    <span className="relative z-10">{loading ? "Updating..." : "Update password"}</span>
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.08] transition-opacity" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
