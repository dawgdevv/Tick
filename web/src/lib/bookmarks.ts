import type { BookmarkNode, Quicklink } from "@/types";

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function buildBookmarkTree(links: Quicklink[]): BookmarkNode[] {
  const byParent = new Map<number | null, Quicklink[]>();

  for (const link of links) {
    const key = link.parent_id ?? null;
    const group = byParent.get(key) ?? [];
    group.push(link);
    byParent.set(key, group);
  }

  const sortGroup = (items: Quicklink[]) =>
    [...items].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);

  const build = (parentId: number | null): BookmarkNode[] =>
    sortGroup(byParent.get(parentId) ?? []).map((link) => ({
      ...link,
      children: link.type === "folder" ? build(link.id) : [],
    }));

  return build(null);
}

export function findBookmark(links: Quicklink[], id: number): Quicklink | undefined {
  return links.find((l) => l.id === id);
}

export function getBreadcrumb(links: Quicklink[], folderId: number | null): Quicklink[] {
  if (folderId === null) return [];
  const trail: Quicklink[] = [];
  let current = findBookmark(links, folderId);
  while (current) {
    trail.unshift(current);
    current = current.parent_id != null ? findBookmark(links, current.parent_id) : undefined;
  }
  return trail;
}

export function getFolderContents(links: Quicklink[], folderId: number | null): Quicklink[] {
  return links
    .filter((l) => (l.parent_id ?? null) === folderId)
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
}
