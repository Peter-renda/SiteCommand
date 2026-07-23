"use client";

import { useState } from "react";

/**
 * Soft email-verification prompt shown on the welcome/onboarding page when the
 * signed-in user's email isn't verified yet. Verification isn't hard-enforced
 * (so a mail hiccup can't lock a new member out), but this nudges them and lets
 * them resend the confirmation link without leaving onboarding.
 */
export default function VerifyBanner({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function resend() {
    setStatus("sending");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      className="mb-6 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
      style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}
    >
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">Confirm your email address</p>
        <p className="text-sm text-gray-600 mt-0.5">
          {status === "sent"
            ? `A new confirmation link is on its way to ${email}.`
            : `We sent a confirmation link to ${email}. Verify to keep your account secure.`}
        </p>
      </div>
      {status !== "sent" && (
        <button
          type="button"
          onClick={resend}
          disabled={status === "sending"}
          className="shrink-0 inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: "#EA580C" }}
        >
          {status === "sending" ? "Sending…" : status === "error" ? "Try again" : "Resend email"}
        </button>
      )}
    </div>
  );
}
