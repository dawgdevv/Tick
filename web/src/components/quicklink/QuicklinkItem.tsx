import { X } from "lucide-react";
import type { Quicklink } from "@/types";

interface QuicklinkItemProps {
  link: Quicklink;
  index: number;
  onDelete: (id: number) => void;
}

export function QuicklinkItem({ link, index, onDelete }: QuicklinkItemProps) {
  return (
    <div className="group flex items-center gap-2 px-2 py-2 rounded-md hover:bg-[var(--hover)] transition-colors duration-150">
      <span className="font-mono text-[10px] w-4 text-right text-[var(--faint)] shrink-0 select-none">
        {index + 1}
      </span>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-xs text-[var(--secondary)] hover:text-[var(--text)] truncate transition-colors duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {link.name}
      </a>
      <button
        onClick={() => onDelete(link.id)}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[var(--muted)] hover:text-[var(--red)] transition-opacity duration-150"
        aria-label={`Remove link "${link.name}"`}
      >
        <X size={10} aria-hidden="true" />
      </button>
    </div>
  );
}
