import {
  ChevronRight,
  ExternalLink,
  Folder,
  FolderOpen,
  Globe,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Quicklink } from "@/types";

interface BookmarkRowProps {
  item: Quicklink;
  depth?: number;
  expanded: boolean;
  onToggleFolder: (id: number) => void;
  onOpenFolder: (id: number) => void;
  onEdit: (item: Quicklink) => void;
  onDelete: (id: number) => void;
}

export function BookmarkRow({
  item,
  depth = 0,
  expanded,
  onToggleFolder,
  onOpenFolder,
  onEdit,
  onDelete,
}: BookmarkRowProps) {
  const isFolder = item.type === "folder";
  const paddingLeft = 12 + depth * 14;

  return (
    <div
      className="group flex items-center gap-1.5 pr-2 py-2 rounded-lg hover:bg-[var(--panel-hover)] transition-colors duration-150"
      style={{ paddingLeft }}
    >
      {isFolder ? (
        <button
          onClick={() => onToggleFolder(item.id)}
          className="w-5 h-5 flex items-center justify-center shrink-0 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          aria-label={expanded ? "Collapse folder" : "Expand folder"}
        >
          <ChevronRight
            size={12}
            className={`transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
          />
        </button>
      ) : (
        <span className="w-5 flex items-center justify-center shrink-0 text-[var(--text-faint)]">
          <Globe size={11} />
        </span>
      )}

      {isFolder ? (
        <button
          onClick={() => onOpenFolder(item.id)}
          className="flex-1 flex items-center gap-2 min-w-0 text-left"
        >
          {expanded ? (
            <FolderOpen size={13} className="text-[var(--accent)] shrink-0" />
          ) : (
            <Folder size={13} className="text-[var(--accent)] shrink-0" />
          )}
          <span className="text-[13px] text-[var(--text-secondary)] group-hover:text-[var(--text)] truncate transition-colors">
            {item.name}
          </span>
        </button>
      ) : (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center gap-2 min-w-0 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text)] truncate transition-colors"
        >
          <span className="truncate">{item.name}</span>
          <ExternalLink size={10} className="opacity-0 group-hover:opacity-60 shrink-0" />
        </a>
      )}

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(item)}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          aria-label="Edit"
        >
          <Pencil size={11} />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--error)]"
          aria-label="Delete"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}
