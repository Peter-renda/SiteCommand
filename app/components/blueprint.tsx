import type { ReactNode } from "react";

/**
 * Shared primitives for the "Field Command / Blueprint" marketing design —
 * the same visual language as the home page (app/page.tsx). Kept here so the
 * blog, success-stories, and other landing pages stay pixel-consistent.
 */

export const INK = "#0E0E0C";
export const ORANGE = "#EA580C";
export const LIGHT_BG = "#FAF9F6";

/** Technical mono label with a leading safety-orange square. */
export function MonoTag({
  children,
  tone = "light",
  className = "",
}: {
  children: ReactNode;
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase ${className}`}
      style={{ color: tone === "dark" ? "rgba(255,255,255,0.55)" : "#6B7280" }}
    >
      <span className="w-2 h-2 shrink-0" style={{ background: ORANGE }} />
      {children}
    </span>
  );
}

/** Blueprint registration ticks in the four corners of a card. */
export function CornerTicks({ color = "rgba(14,14,12,0.22)" }: { color?: string }) {
  const base = "absolute w-2.5 h-2.5 pointer-events-none";
  return (
    <>
      <span className={`${base} top-2 left-2`} style={{ borderTop: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` }} aria-hidden="true" />
      <span className={`${base} top-2 right-2`} style={{ borderTop: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` }} aria-hidden="true" />
      <span className={`${base} bottom-2 left-2`} style={{ borderBottom: `1.5px solid ${color}`, borderLeft: `1.5px solid ${color}` }} aria-hidden="true" />
      <span className={`${base} bottom-2 right-2`} style={{ borderBottom: `1.5px solid ${color}`, borderRight: `1.5px solid ${color}` }} aria-hidden="true" />
    </>
  );
}

/** White technical card with hairline border, corner ticks, and hover lift. */
export function BlueprintCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`sc-card relative h-full bg-white rounded-xl p-7 ${className}`} style={{ border: "1px solid rgba(14,14,12,0.09)" }}>
      <CornerTicks />
      {children}
    </div>
  );
}
