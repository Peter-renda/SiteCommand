"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type State = "verifying" | "success" | "error" | "missing";

function VerifyEmailInner() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<State>(token ? "verifying" : "missing");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok) {
          setState("success");
        } else {
          setState("error");
          setMessage(data.error ?? "We couldn't verify your email.");
        }
      } catch {
        if (!cancelled) {
          setState("error");
          setMessage("Something went wrong. Please try again.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

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
            {state === "verifying" && (
              <>
                <h1 className="font-display text-2xl text-gray-950 mb-2">Verifying your email…</h1>
                <p className="text-sm text-gray-500">Hang tight for a moment.</p>
              </>
            )}
            {state === "success" && (
              <>
                <h1 className="font-display text-2xl text-gray-950 mb-2">Email verified ✓</h1>
                <p className="text-sm text-gray-500 leading-relaxed mb-8">
                  Thanks — your email address is confirmed. You&apos;re all set.
                </p>
                <Link
                  href="/dashboard"
                  className="block w-full py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] text-center"
                  style={{ background: "#111110" }}
                >
                  Go to dashboard
                </Link>
              </>
            )}
            {(state === "error" || state === "missing") && (
              <>
                <h1 className="font-display text-2xl text-gray-950 mb-2">Verification failed</h1>
                <p className="text-sm text-gray-500 leading-relaxed mb-8">
                  {state === "missing"
                    ? "This link is missing its verification token."
                    : message || "This verification link is invalid or has expired."}{" "}
                  You can request a new link from your dashboard.
                </p>
                <Link
                  href="/dashboard"
                  className="block w-full py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] text-center"
                  style={{ background: "#111110" }}
                >
                  Go to dashboard
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
