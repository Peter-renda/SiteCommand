import type { CSSProperties } from "react";

// Shared "bezel" card styling used across the Career Center page and its
// interactive tool sections (Resume Builder, Interview Simulator, Salary
// Benchmarks) so every card reads as one system.

export const bezelOuter: CSSProperties = {
  background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(235,235,233,0.5) 100%)",
  border: "1px solid rgba(0,0,0,0.055)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.7) inset",
  padding: "1.5px",
  borderRadius: "16px",
};

export const bezelInner: CSSProperties = {
  background: "#FFFFFF",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
  borderRadius: "14px",
};

export const ORANGE = "#EA580C";

const baseInput: CSSProperties = {
  borderColor: "rgba(0,0,0,0.1)",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};

export const inputStyle = baseInput;

export const inputClass =
  "w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-900 bg-white transition-all focus:outline-none";

export function focusOrange(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = ORANGE;
}

export function blurBorder(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)";
}

export const primaryButtonStyle: CSSProperties = {
  background: ORANGE,
  boxShadow: "0 4px 14px rgba(234,88,12,0.3)",
};

export const primaryButtonClass =
  "px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50";
