import { useState, useCallback, useEffect } from "react";
import type { Quicklink } from "@/types";
import { normalizeUrl } from "@/lib/bookmarks";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Quicklink[]>([]);

  const normalize = (data: Quicklink[]): Quicklink[] =>
    data.map((b) => ({
      ...b,
      type: (b.type || "bookmark") as Quicklink["type"],
      parent_id: b.parent_id ?? null,
      sort_order: b.sort_order ?? 0,
    }));

  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await fetch("/api/quicklinks");
      if (res.ok) {
        const data = (await res.json()) as Quicklink[];
        setBookmarks(normalize(data));
      }
    } catch {
      /* keep current state on network error */
    }
  }, []);

  useEffect(() => {
    void fetchBookmarks();
  }, [fetchBookmarks]);

  const addBookmark = async (
    name: string,
    url: string,
    parentId: number | null = null
  ) => {
    if (!name.trim() || !url.trim()) return;
    try {
      const res = await fetch("/api/quicklinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          url: normalizeUrl(url),
          type: "bookmark",
          parent_id: parentId,
        }),
      });
      if (res.ok) await fetchBookmarks();
    } catch {
      await fetchBookmarks();
    }
  };

  const addFolder = async (name: string, parentId: number | null = null) => {
    if (!name.trim()) return;
    try {
      const res = await fetch("/api/quicklinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type: "folder",
          parent_id: parentId,
        }),
      });
      if (res.ok) await fetchBookmarks();
    } catch {
      await fetchBookmarks();
    }
  };

  const updateBookmark = async (
    id: number,
    updates: { name?: string; url?: string; parent_id?: number | null }
  ) => {
    const body: Record<string, unknown> = {};
    if (updates.name !== undefined) body.name = updates.name.trim();
    if (updates.url !== undefined) body.url = normalizeUrl(updates.url);
    if (updates.parent_id !== undefined) body.parent_id = updates.parent_id;

    try {
      const res = await fetch(`/api/quicklinks?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) await fetchBookmarks();
    } catch {
      await fetchBookmarks();
    }
  };

  const deleteBookmark = async (id: number) => {
    try {
      await fetch(`/api/quicklinks?id=${id}`, { method: "DELETE" });
    } catch {
      /* refetch below */
    }
    await fetchBookmarks();
  };

  const importBookmarks = async (
    data: string,
    format: "html" | "json",
    parentId: number | null = null
  ) => {
    try {
      const res = await fetch("/api/quicklinks/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, format, parent_id: parentId }),
      });
      if (res.ok) {
        const updated = (await res.json()) as Quicklink[];
        setBookmarks(normalize(updated));
        return;
      }
    } catch {
      /* refetch below */
    }
    await fetchBookmarks();
  };

  const exportBookmarks = (format: "html" | "json") => {
    window.open(`/api/quicklinks/export?format=${format}`, "_blank");
  };

  return {
    bookmarks,
    addBookmark,
    addFolder,
    updateBookmark,
    deleteBookmark,
    importBookmarks,
    exportBookmarks,
    refresh: fetchBookmarks,
  };
}
