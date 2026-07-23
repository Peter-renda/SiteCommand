"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CheckoutSuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function finalize() {
      // The session isn't established until checkout genuinely completes. Mint
      // it here from the verified Stripe checkout session, then head into the app.
      if (!sessionId) {
        if (!cancelled) setFailed(true);
        return;
      }
      try {
        const res = await fetch("/api/checkout/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        if (cancelled) return;
        if (res.ok) {
          router.push("/welcome");
        } else {
          setFailed(true);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    finalize();
    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  if (failed) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            We couldn&apos;t confirm your checkout
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            If you completed payment, please sign in to continue. Otherwise you can
            restart from the pricing page.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="/login"
              className="py-2.5 px-4 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#111110" }}
            >
              Sign in
            </a>
            <a
              href="/pricing"
              className="py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-900"
              style={{ border: "1px solid rgba(0,0,0,0.10)" }}
            >
              Back to pricing
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          You&apos;re all set!
        </h1>
        <p className="text-sm text-gray-500 mb-2">
          Your subscription is active. Taking you to your dashboard...
        </p>
        <p className="text-xs text-gray-300">One moment</p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <CheckoutSuccessInner />
    </Suspense>
  );
}
