import { useState, useCallback, useEffect } from "react";
import type { Scratchpad } from "@/types";

export function useScratchpad() {
  const [scratchpad, setScratchpad] = useState<Scratchpad | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchScratchpad = useCallback(async () => {
    try {
      const res = await fetch("/api/scratchpad");
      if (res.ok) {
        const data = await res.json();
        setScratchpad(data);
      }
    } catch { /* keep current state */ }
  }, []);

  useEffect(() => {
    void fetchScratchpad();
  }, [fetchScratchpad]);

  const updateScratchpad = useCallback(async (content: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/scratchpad", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const data = await res.json();
        setScratchpad(data);
      }
    } catch { /* silent fail */ }
    setSaving(false);
  }, []);

  return {
    scratchpad,
    saving,
    updateScratchpad,
  };
}
