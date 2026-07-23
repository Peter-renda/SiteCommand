"use client";

import { useState } from "react";
import Link from "next/link";

const inputStyle = {
  borderColor: "rgba(0,0,0,0.1)",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
} as const;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
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
            {sent ? (
              <>
                <h1 className="font-display text-2xl text-gray-950 mb-2">Check your email</h1>
                <p className="text-sm text-gray-500 leading-relaxed mb-8">
                  If an account exists for <span className="font-medium text-gray-900">{email}</span>, a
                  password reset link is on its way. The link expires in 1 hour.
                </p>
                <Link
                  href="/login"
                  className="group relative block w-full py-3 px-4 rounded-xl text-sm font-semibold text-white overflow-hidden transition-all active:scale-[0.98] text-center"
                  style={{ background: "#111110" }}
                >
                  Back to sign in
                </Link>
              </>
            ) : (
              <>
                <h1 className="font-display text-2xl text-gray-950 mb-2">Reset your password</h1>
                <p className="text-sm text-gray-400 mb-8">
                  Enter your email and we&apos;ll send you a link to set a new password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-900 bg-white transition-all focus:outline-none"
                      style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor = "#2563EB"}
                      onBlur={e => e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)"}
                      placeholder="you@example.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full py-3 px-4 rounded-xl text-sm font-semibold text-white overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50"
                    style={{ background: "#111110" }}
                  >
                    <span className="relative z-10">{loading ? "Sending..." : "Send reset link"}</span>
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.08] transition-opacity" />
                  </button>
                </form>

                <p className="text-sm text-gray-400 mt-6 text-center">
                  Remembered it?{" "}
                  <Link href="/login" className="text-gray-900 font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
