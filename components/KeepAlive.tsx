"use client";

import { useEffect } from "react";

// Ping l'API toutes les 4 minutes pour éviter les cold starts Vercel
export default function KeepAlive() {
  useEffect(() => {
    const ping = () => fetch("/api/ping").catch(() => {});
    const interval = setInterval(ping, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  return null;
}
