"use client";

import { useEffect, useState } from "react";

type Status = "checking" | "ok" | "down";

type Props = {
  name: string;
  port: number;
  url: string | undefined;
};

export default function ServiceStatus({ name, port, url }: Props) {
  const [status, setStatus] = useState<Status>("checking");
  const [detail, setDetail] = useState<string>("");

  useEffect(() => {
    if (!url) {
      setStatus("down");
      setDetail("env var not set");
      return;
    }
    const controller = new AbortController();
    fetch(`${url}/health`, { signal: controller.signal })
      .then((r) => r.json())
      .then((body) => {
        setStatus("ok");
        setDetail(body.db ? `db: ${body.db}` : "stateless");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setStatus("down");
        setDetail("unreachable");
      });
    return () => controller.abort();
  }, [url]);

  const dotClass =
    status === "ok" ? "bg-emerald-500" :
    status === "down" ? "bg-red-500" :
    "bg-neutral-300 animate-pulse";

  return (
    <li className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
        <span className="font-medium">{name}</span>
        <span className="text-xs text-neutral-400">:{port}</span>
      </div>
      <span className="text-xs text-neutral-500">{detail}</span>
    </li>
  );
}
