"use client";

import { useEffect, useState } from "react";

export function OrderCountdown({ expiresAt }: { expiresAt: string | null }) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRemaining(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    tick(); const timer = window.setInterval(tick, 1000); return () => window.clearInterval(timer);
  }, [expiresAt]);
  if (!expiresAt) return <strong>等待下一步</strong>;
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return <strong>{remaining > 0 ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` : "已到期"}</strong>;
}
