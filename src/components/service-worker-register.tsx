"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js in production only. In development a cached app shell would hide
 * code changes, so any previously installed worker is removed instead.
 * Service workers need a secure context (https or localhost).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    } else {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
    }
  }, []);
  return null;
}
