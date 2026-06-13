import { useState } from "react";
import { X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

interface AddBookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, url: string) => void;
  title?: string;
}

export function AddBookmarkDialog({
  open,
  onOpenChange,
  onSave,
  title = "Add Bookmark",
}: AddBookmarkDialogProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const reset = () => {
    setName("");
    setUrl("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name, url);
    reset();
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) reset();
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm animate-overlay-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] -translate-x-1/2 -translate-y-1/2 w-[340px] rounded-2xl p-6 shadow-2xl animate-fade-in bg-[var(--panel)] border border-[var(--border)]">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-[15px] font-semibold text-[var(--text)]">
              {title}
            </Dialog.Title>
            <Dialog.Close className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--panel-hover)] transition-colors duration-150">
              <X size={14} />
            </Dialog.Close>
          </div>

          <Dialog.Description className="sr-only">
            Add a bookmark with a name and URL.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="bm-name"
                className="block text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)] font-medium mb-2"
              >
                name
              </label>
              <input
                id="bm-name"
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="GitHub"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="field-input"
              />
            </div>
            <div>
              <label
                htmlFor="bm-url"
                className="block text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)] font-medium mb-2"
              >
                url
              </label>
              <input
                id="bm-url"
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="github.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="field-input"
              />
            </div>
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
