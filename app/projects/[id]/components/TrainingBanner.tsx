"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Headless auto-save for a "SiteCommand Training" sandbox.
 *
 * The visible amber "SiteCommand Training — sandbox project…" banner was
 * removed at the user's request; this component now renders nothing and only
 * drives the Google-Docs-style checkpoint save. The sandbox's tool records
 * already persist per-action; this records a "last saved" checkpoint (a
 * heartbeat every 60s plus a save on tab hide/close) so progress is tracked
 * and surfaced on the Practice list.
 */

const HEARTBEAT_MS = 60_000;

export default function TrainingBanner({ projectId }: { projectId: string }) {
  const savingRef = useRef(false);

  const save = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      await fetch(`/api/training/projects/${projectId}/save`, { method: "POST" });
    } catch {
      /* best-effort checkpoint — safe to miss a beat */
    } finally {
      savingRef.current = false;
    }
  }, [projectId]);

  // Heartbeat auto-save.
  useEffect(() => {
    const beat = setInterval(save, HEARTBEAT_MS);
    return () => clearInterval(beat);
  }, [save]);

  // Checkpoint when the user leaves/hides/closes the tab (closest thing to
  // "saved on close"). sendBeacon survives unload and sends session cookies.
  useEffect(() => {
    const url = `/api/training/projects/${projectId}/save`;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") navigator.sendBeacon?.(url);
    };
    const onPageHide = () => navigator.sendBeacon?.(url);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [projectId]);

  return null;
}
