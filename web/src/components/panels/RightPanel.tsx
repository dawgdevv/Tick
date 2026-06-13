import { useState } from "react";
import { Plus, X } from "lucide-react";
import { AddQuicklinkModal } from "@/components/quicklink/AddQuicklinkModal";
import type { Quicklink } from "@/types";

interface RightPanelProps {
  quicklinks: Quicklink[];
  onAddQuicklink: (name: string, url: string) => void;
  onDeleteQuicklink: (id: number) => void;
}

export function RightPanel({ quicklinks, onAddQuicklink, onDeleteQuicklink }: RightPanelProps) {
  const [qlOpen, setQlOpen] = useState(false);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] font-medium">
          quick links
        </span>

        <AddQuicklinkModal
          open={qlOpen}
          onOpenChange={setQlOpen}
          onSave={(name, url) => {
            onAddQuicklink(name, url);
            setQlOpen(false);
          }}
        >
          <button
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--panel-hover)] transition-colors duration-150"
            aria-label="Add quicklink"
          >
            <Plus size={14} />
          </button>
        </AddQuicklinkModal>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-[var(--divider)]" />

      {/* Links */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
        {quicklinks.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-[11px] text-[var(--text-faint)]">no links yet</p>
          </div>
        ) : (
          <div className="px-2">
            {quicklinks.map((link, i) => (
              <div
                key={link.id}
                className="group flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-[var(--panel-hover)] transition-colors duration-150"
              >
                <span className="font-mono text-[10px] w-5 text-right text-[var(--text-faint)] shrink-0 select-none">
                  {i + 1}
                </span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text)] truncate transition-colors duration-150"
                >
                  {link.name}
                </a>
                <button
                  onClick={() => onDeleteQuicklink(link.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--text-muted)] hover:text-[var(--error)] transition-all duration-150"
                  aria-label="Remove link"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
