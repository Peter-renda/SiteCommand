"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PricingCheckoutButtonProps {
  plan: string;
  label: string;
  highlight: boolean;
  isAuthenticated: boolean;
}

export default function PricingCheckoutButton({
  plan,
  label,
  highlight,
  isAuthenticated,
}: PricingCheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const endpoint = isAuthenticated
        ? "/api/stripe/checkout"
        : "/api/stripe/checkout/new";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-8">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`block w-full text-center py-2.5 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
          highlight
            ? "bg-white text-gray-900 hover:bg-gray-100"
            : "bg-gray-900 text-white hover:bg-gray-700"
        }`}
      >
        {loading ? "Loading..." : label}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
