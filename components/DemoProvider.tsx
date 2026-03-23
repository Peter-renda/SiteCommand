"use client";

import { useEffect } from "react";
import { installDemoFetchInterceptor } from "@/lib/demo-interceptor";

/**
 * DemoProvider
 *
 * Mounts invisibly in the root layout. If the `demo_mode` cookie is present
 * (set at demo login), it installs the client-side fetch interceptor so all
 * API mutations are handled in sessionStorage instead of reaching the server.
 *
 * sessionStorage is cleared automatically by the browser when the tab closes,
 * so no demo data persists beyond the current browser tab.
 */
export default function DemoProvider() {
  useEffect(() => {
    const isDemo = document.cookie
      .split(";")
      .some((c) => c.trim().startsWith("demo_mode="));

    if (isDemo) {
      installDemoFetchInterceptor();
    }
  }, []);

  return null;
}
