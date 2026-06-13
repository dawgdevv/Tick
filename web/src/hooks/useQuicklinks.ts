import { useState, useCallback, useEffect } from "react";
import type { Quicklink } from "@/types";

export function useQuicklinks() {
  const [quicklinks, setQuicklinks] = useState<Quicklink[]>([]);

  const fetchQuicklinks = useCallback(async () => {
    try {
      const res = await fetch("/api/quicklinks");
      if (res.ok) setQuicklinks((await res.json()) ?? []);
    } catch { /* keep current state on network error */ }
  }, []);

  useEffect(() => {
    void fetchQuicklinks();
  }, [fetchQuicklinks]);

  const addQuicklink = async (name: string, url: string) => {
    if (!name.trim() || !url.trim()) return;
    const finalUrl = /^https?:\/\//i.test(url.trim())
      ? url.trim()
      : `https://${url.trim()}`;
    try {
      const res = await fetch("/api/quicklinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), url: finalUrl }),
      });
      if (res.ok) await fetchQuicklinks();
    } catch { await fetchQuicklinks(); }
  };

  const deleteQuicklink = async (id: number) => {
    try {
      const res = await fetch(`/api/quicklinks?id=${id}`, { method: "DELETE" });
      if (res.ok) setQuicklinks((p) => p.filter((l) => l.id !== id));
      else await fetchQuicklinks();
    } catch { await fetchQuicklinks(); }
  };

  return {
    quicklinks,
    addQuicklink,
    deleteQuicklink,
  };
}
