import { useState, useEffect } from "react";
import { X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Quicklink } from "@/types";

interface EditBookmarkDialogProps {
  item: Quicklink | null;
  onOpenChange: (open: boolean) => void;
  onSave: (id: number, name: string, url: string) => void;
}

export function EditBookmarkDialog({ item, onOpenChange, onSave }: EditBookmarkDialogProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (item) {
      setName(item.name);
      setUrl(item.url);
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    onSave(item.id, name, url);
    onOpenChange(false);
  };

  const isFolder = item?.type === "folder";

  return (
    <Dialog.Root open={item !== null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm animate-overlay-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] -translate-x-1/2 -translate-y-1/2 w-[340px] rounded-2xl p-6 shadow-2xl animate-fade-in bg-[var(--panel)] border border-[var(--border)]">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-[15px] font-semibold text-[var(--text)]">
              {isFolder ? "Edit Folder" : "Edit Bookmark"}
            </Dialog.Title>
            <Dialog.Close className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--panel-hover)] transition-colors duration-150">
              <X size={14} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="edit-bm-name"
                className="block text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)] font-medium mb-2"
              >
                name
              </label>
              <input
                id="edit-bm-name"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="field-input"
              />
            </div>
            {!isFolder && (
              <div>
                <label
                  htmlFor="edit-bm-url"
                  className="block text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)] font-medium mb-2"
                >
                  url
                </label>
                <input
                  id="edit-bm-url"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="field-input"
                />
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex-1 py-2.5 rounded-xl text-[13px] text-[var(--text-muted)] bg-[var(--panel-hover)] hover:text-[var(--text-secondary)] transition-colors duration-200"
                >
                  cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-[var(--bg)] bg-[var(--accent)] hover:opacity-90 transition-opacity duration-200"
              >
                save
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
