import { useMemo, useRef, useState } from "react";
import {
  Bookmark,
  ChevronRight,
  Download,
  FolderPlus,
  Link2,
  Plus,
  Upload,
} from "lucide-react";
import type { Quicklink } from "@/types";
import { getBreadcrumb, getFolderContents } from "@/lib/bookmarks";
import { BookmarkRow } from "./BookmarkRow";
import { AddBookmarkDialog } from "./AddBookmarkDialog";
import { AddFolderDialog } from "./AddFolderDialog";
import { EditBookmarkDialog } from "./EditBookmarkDialog";

interface BookmarkManagerProps {
  bookmarks: Quicklink[];
  onAddBookmark: (name: string, url: string, parentId?: number | null) => void;
  onAddFolder: (name: string, parentId?: number | null) => void;
  onUpdateBookmark: (
    id: number,
    updates: { name?: string; url?: string }
  ) => void;
  onDeleteBookmark: (id: number) => void;
  onImport: (data: string, format: "html" | "json", parentId?: number | null) => void;
  onExport: (format: "html" | "json") => void;
}

export function BookmarkManager({
  bookmarks,
  onAddBookmark,
  onAddFolder,
  onUpdateBookmark,
  onDeleteBookmark,
  onImport,
  onExport,
}: BookmarkManagerProps) {
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const [addFolderOpen, setAddFolderOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Quicklink | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const breadcrumb = useMemo(
    () => getBreadcrumb(bookmarks, currentFolderId),
    [bookmarks, currentFolderId]
  );

  const visibleItems = useMemo(
    () => getFolderContents(bookmarks, currentFolderId),
    [bookmarks, currentFolderId]
  );

  const toggleFolder = (id: number) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderChildren = (parentId: number, depth: number): React.ReactNode => {
    if (!expandedFolders.has(parentId)) return null;
    return getFolderContents(bookmarks, parentId).map((child) => (
      <div key={child.id}>
        <BookmarkRow
          item={child}
          depth={depth}
          expanded={expandedFolders.has(child.id)}
          onToggleFolder={toggleFolder}
          onOpenFolder={(id) => {
            setCurrentFolderId(id);
            setExpandedFolders(new Set());
          }}
          onEdit={setEditingItem}
          onDelete={onDeleteBookmark}
        />
        {child.type === "folder" && renderChildren(child.id, depth + 1)}
      </div>
    ));
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const format = file.name.endsWith(".json") ? "json" : "html";
    onImport(text, format, currentFolderId);
    e.target.value = "";
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <span className="section-label">
          <Bookmark size={12} className="text-[var(--text-faint)]" strokeWidth={1.75} />
          bookmarks
        </span>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setAddLinkOpen(true)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--panel-hover)] transition-colors"
            aria-label="Add bookmark"
            title="Add bookmark"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => setAddFolderOpen(true)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--panel-hover)] transition-colors"
            aria-label="Add folder"
            title="Add folder"
          >
            <FolderPlus size={14} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--panel-hover)] transition-colors"
            aria-label="Import bookmarks"
            title="Import"
          >
            <Upload size={14} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu((p) => !p)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--panel-hover)] transition-colors"
              aria-label="Export bookmarks"
              title="Export"
            >
              <Download size={14} />
            </button>
            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-[var(--border)] bg-[var(--panel)] shadow-xl py-1 animate-fade-in">
                  <button
                    onClick={() => {
                      onExport("html");
                      setShowExportMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-[12px] text-[var(--text-secondary)] hover:bg-[var(--panel-hover)] hover:text-[var(--text)]"
                  >
                    Export HTML
                  </button>
                  <button
                    onClick={() => {
                      onExport("json");
                      setShowExportMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-[12px] text-[var(--text-secondary)] hover:bg-[var(--panel-hover)] hover:text-[var(--text)]"
                  >
                    Export JSON
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.htm,.json"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* Breadcrumb */}
      <div className="px-5 pb-2 flex items-center gap-1 flex-wrap min-h-[24px]">
        <button
          onClick={() => setCurrentFolderId(null)}
          className={`text-[11px] transition-colors ${
            currentFolderId === null
              ? "text-[var(--text-secondary)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        >
          All bookmarks
        </button>
        {breadcrumb.map((folder) => (
          <span key={folder.id} className="flex items-center gap-1">
            <ChevronRight size={10} className="text-[var(--text-faint)]" />
            <button
              onClick={() => setCurrentFolderId(folder.id)}
              className={`text-[11px] transition-colors truncate max-w-[100px] ${
                currentFolderId === folder.id
                  ? "text-[var(--text-secondary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {folder.name}
            </button>
          </span>
        ))}
      </div>

      <div className="mx-4 h-px bg-[var(--divider)]" />

      {/* Bookmark list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-2 px-1">
        {visibleItems.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <Link2 size={20} className="mx-auto mb-3 text-[var(--text-faint)]" />
            <p className="text-[11px] text-[var(--text-faint)]">
              {currentFolderId ? "This folder is empty" : "No bookmarks yet"}
            </p>
            <button
              onClick={() => setAddLinkOpen(true)}
              className="mt-3 text-[11px] text-[var(--accent)] hover:opacity-80"
            >
              Add your first bookmark
            </button>
          </div>
        ) : (
          visibleItems.map((item) => (
            <div key={item.id}>
              <BookmarkRow
                item={item}
                depth={0}
                expanded={expandedFolders.has(item.id)}
                onToggleFolder={toggleFolder}
                onOpenFolder={(id) => {
                  setCurrentFolderId(id);
                  setExpandedFolders(new Set());
                }}
                onEdit={setEditingItem}
                onDelete={onDeleteBookmark}
              />
              {item.type === "folder" && renderChildren(item.id, 1)}
            </div>
          ))
        )}
      </div>

      <AddBookmarkDialog
        open={addLinkOpen}
        onOpenChange={setAddLinkOpen}
        onSave={(name, url) => {
          onAddBookmark(name, url, currentFolderId);
          setAddLinkOpen(false);
        }}
        title={currentFolderId ? "Add Bookmark to Folder" : "Add Bookmark"}
      />

      <AddFolderDialog
        open={addFolderOpen}
        onOpenChange={setAddFolderOpen}
        onSave={(name) => {
          onAddFolder(name, currentFolderId);
          setAddFolderOpen(false);
        }}
      />

      <EditBookmarkDialog
        item={editingItem}
        onOpenChange={(open) => {
          if (!open) setEditingItem(null);
        }}
        onSave={(id, name, url) => {
          onUpdateBookmark(id, { name, url });
          setEditingItem(null);
        }}
      />
    </div>
  );
}
