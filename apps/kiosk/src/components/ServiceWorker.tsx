"use client";

import { useEffect } from "react";
import { BASE_PATH } from "@/lib/site";

/** Registers the offline cache in production builds (dev reloads too often for it to help). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(`${BASE_PATH}/sw.js`, { scope: BASE_PATH }).catch(() => {});
  }, []);
  return null;
}
