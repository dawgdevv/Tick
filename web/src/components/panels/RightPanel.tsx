import { BookmarkManager } from "@/components/bookmarks/BookmarkManager";
import type { Quicklink } from "@/types";

interface RightPanelProps {
  bookmarks: Quicklink[];
  onAddBookmark: (name: string, url: string, parentId?: number | null) => void;
  onAddFolder: (name: string, parentId?: number | null) => void;
  onUpdateBookmark: (
    id: number,
    updates: { name?: string; url?: string }
  ) => void;
  onDeleteBookmark: (id: number) => void;
  onImportBookmarks: (
    data: string,
    format: "html" | "json",
    parentId?: number | null
  ) => void;
  onExportBookmarks: (format: "html" | "json") => void;
}

export function RightPanel({
  bookmarks,
  onAddBookmark,
  onAddFolder,
  onUpdateBookmark,
  onDeleteBookmark,
  onImportBookmarks,
  onExportBookmarks,
}: RightPanelProps) {
  return (
    <BookmarkManager
      bookmarks={bookmarks}
      onAddBookmark={onAddBookmark}
      onAddFolder={onAddFolder}
      onUpdateBookmark={onUpdateBookmark}
      onDeleteBookmark={onDeleteBookmark}
      onImport={onImportBookmarks}
      onExport={onExportBookmarks}
    />
  );
}
