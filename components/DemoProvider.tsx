"use client";

import { useEffect } from "react";
import { installDemoFetchInterceptor } from "@/lib/demo-interceptor";

function hasDemoCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith("demo_mode="));
}

// Install the fetch interceptor as soon as this client module loads, before any
// child component's useEffect can fire a fetch. React runs effects child-first,
// so deferring install to DemoProvider's useEffect causes a race where the very
// first page-load fetches bypass the interceptor and read empty data from the
// real server, making demo data (like newly created RFIs) appear to vanish on
// reload or after a logout/login cycle.
if (typeof window !== "undefined" && hasDemoCookie()) {
  installDemoFetchInterceptor();
}

export default function DemoProvider() {
  useEffect(() => {
    if (hasDemoCookie()) {
      installDemoFetchInterceptor();
    }
  }, []);

  return null;
}
