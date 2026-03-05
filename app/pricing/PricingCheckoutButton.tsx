"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PricingCheckoutButtonProps {
  plan: string;
  label: string;
  highlight: boolean;
}

export default function PricingCheckoutButton({
  plan,
  label,
  highlight,
}: PricingCheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (res.status === 401) {
        router.push(`/signup?plan=${plan}`);
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`block w-full text-center py-2.5 px-4 rounded-lg text-sm font-medium transition-colors mb-8 disabled:opacity-50 ${
        highlight
          ? "bg-white text-gray-900 hover:bg-gray-100"
          : "bg-gray-900 text-white hover:bg-gray-700"
      }`}
    >
      {loading ? "Loading..." : label}
    </button>
  );
}
