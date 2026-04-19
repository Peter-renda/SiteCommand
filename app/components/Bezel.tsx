import type { ReactNode, CSSProperties } from "react";

type BezelSize = "sm" | "md" | "lg" | "xl";
type BezelElevation = "flat" | "soft" | "lifted";

type BezelProps = {
  children: ReactNode;
  size?: BezelSize;
  elevation?: BezelElevation;
  className?: string;
  innerClassName?: string;
  style?: CSSProperties;
  innerStyle?: CSSProperties;
};

const SIZE_MAP: Record<BezelSize, { outer: number; inner: number; padding: number }> = {
  sm: { outer: 12, inner: 10, padding: 1.5 },
  md: { outer: 16, inner: 14, padding: 2 },
  lg: { outer: 20, inner: 18, padding: 2 },
  xl: { outer: 24, inner: 22, padding: 2 },
};

const ELEVATION_MAP: Record<BezelElevation, string> = {
  flat:   "0 2px 8px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.7) inset",
  soft:   "0 8px 24px rgba(0,0,0,0.07), 0 2px 6px rgba(0,0,0,0.04)",
  lifted: "0 24px 48px rgba(0,0,0,0.09), 0 6px 16px rgba(0,0,0,0.05), 0 1px 0 rgba(255,255,255,0.8) inset",
};

export default function Bezel({
  children,
  size = "md",
  elevation = "lifted",
  className = "",
  innerClassName = "",
  style,
  innerStyle,
}: BezelProps) {
  const { outer, inner, padding } = SIZE_MAP[size];
  return (
    <div
      className={className}
      style={{
        borderRadius: outer,
        background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(235,235,233,0.6) 100%)",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: ELEVATION_MAP[elevation],
        padding,
        ...style,
      }}
    >
      <div
        className={innerClassName}
        style={{
          borderRadius: inner,
          background: "#FFFFFF",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
          overflow: "hidden",
          height: "100%",
          ...innerStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}
