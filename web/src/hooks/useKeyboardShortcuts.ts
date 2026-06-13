import { useEffect } from "react";

interface UseKeyboardShortcutsProps {
  tasksLength: number;
  selectedIdx: number | null;
  setSelectedIdx: (idx: number | null) => void;
  onNewTask: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts({
  tasksLength,
  selectedIdx,
  setSelectedIdx,
  onNewTask,
  onToggle,
  onDelete,
  onEdit,
  onEscape,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement;
      const typing =
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.getAttribute("contenteditable") === "true";

      if (e.key === "Escape") {
        if (typing) el.blur();
        setSelectedIdx(null);
        onEscape?.();
        return;
      }
      if (typing) return;

      switch (e.key) {
        case "n":
          e.preventDefault();
          onNewTask();
          break;
        case "j":
        case "ArrowDown":
          e.preventDefault();
          setSelectedIdx(
            selectedIdx === null ? 0 : Math.min(selectedIdx + 1, tasksLength - 1)
          );
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          setSelectedIdx(
            selectedIdx === null ? tasksLength - 1 : Math.max(selectedIdx - 1, 0)
          );
          break;
        case "x":
          if (selectedIdx !== null && selectedIdx < tasksLength) onToggle();
          break;
        case "d":
          if (selectedIdx !== null && selectedIdx < tasksLength) onDelete();
          break;
        case "e":
          if (selectedIdx !== null && selectedIdx < tasksLength) onEdit?.();
          break;
      }
    };

    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [tasksLength, selectedIdx, setSelectedIdx, onNewTask, onToggle, onDelete, onEscape]);
}
