import { QuicklinkItem } from "./QuicklinkItem";
import type { Quicklink } from "@/types";

interface QuicklinkListProps {
  quicklinks: Quicklink[];
  onDelete: (id: number) => void;
}

export function QuicklinkList({ quicklinks, onDelete }: QuicklinkListProps) {
  if (quicklinks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="font-mono text-[10px] text-[var(--faint)]">
          no links yet
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 divide-y divide-[var(--border)]/50">
      {quicklinks.map((link, i) => (
        <QuicklinkItem
          key={link.id}
          link={link}
          index={i}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
