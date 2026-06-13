import { Plus, ArrowUp, Repeat } from "lucide-react";
import { forwardRef, useState } from "react";
import type { Priority, RecurringType } from "@/types";

interface TaskInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  priority: Priority;
  onPriorityChange: (priority: Priority) => void;
  recurring: boolean;
  onRecurringChange: (recurring: boolean) => void;
  recurringType: RecurringType;
  onRecurringTypeChange: (type: RecurringType) => void;
}

const priorityColors: Record<Priority, string> = {
  high: "#ef4444",
  normal: "#f59e0b",
  low: "#6b7280",
};

export const TaskInput = forwardRef<HTMLInputElement, TaskInputProps>(
  ({ value, onChange, onSubmit, priority, onPriorityChange, recurring, onRecurringChange, recurringType, onRecurringTypeChange }, ref) => {
    const [showOptions, setShowOptions] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!value.trim()) return;
      onSubmit();
    };

    const hasText = value.trim().length > 0;

    return (
      <form onSubmit={handleSubmit} className="max-w-[640px] mx-auto">
        <div className="flex items-center gap-2.5">
          {/* Options — left side, appear when typing */}
          {showOptions && (
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Priority selector */}
              <div className="flex items-center gap-1.5">
                {(Object.keys(priorityColors) as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onPriorityChange(p)}
                    className="w-[26px] h-[26px] rounded-lg flex items-center justify-center transition-all duration-150"
                    style={{
                      background: priority === p ? priorityColors[p] : "var(--bg-elevated)",
                      opacity: priority === p ? 1 : 0.45,
                    }}
                    title={p.charAt(0).toUpperCase() + p.slice(1)}
                  >
                    <ArrowUp
                      size={13}
                      style={{
                        color: priority === p ? "#fff" : priorityColors[p],
                        transform: p === "low" ? "rotate(180deg)" : p === "high" ? "none" : "rotate(90deg)",
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="w-px h-5 bg-[var(--divider)]" />

              {/* Recurring toggle */}
              <button
                type="button"
                onClick={() => onRecurringChange(!recurring)}
                className="w-[26px] h-[26px] rounded-lg flex items-center justify-center transition-all duration-150"
                style={{
                  background: recurring ? "var(--accent-bg)" : "var(--bg-elevated)",
                  opacity: recurring ? 1 : 0.45,
                }}
                title={recurring ? `Repeating ${recurringType}` : "Repeat"}
              >
                <Repeat
                  size={13}
                  style={{ color: recurring ? "var(--accent)" : "var(--text-muted)" }}
                />
              </button>

              {recurring && (
                <select
                  value={recurringType}
                  onChange={(e) => onRecurringTypeChange(e.target.value as RecurringType)}
                  className="text-[10px] font-medium bg-[var(--bg-elevated)] text-[var(--accent)] rounded-md px-2 py-1 outline-none border border-[var(--accent-border)] cursor-pointer"
                >
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekly">Weekly</option>
                </select>
              )}
            </div>
          )}

          {/* Text input */}
          <input
            ref={ref}
            type="text"
            name="task"
            autoComplete="off"
            spellCheck={false}
            placeholder="What do you need to do?"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              if (!showOptions && e.target.value.trim()) setShowOptions(true);
              if (showOptions && !e.target.value.trim()) setShowOptions(false);
            }}
            className="flex-1 bg-transparent outline-none text-[14px] text-[var(--text)] placeholder:text-[var(--text-faint)] py-2 min-w-0"
          />

          {/* Submit button */}
          <button
            type="submit"
            disabled={!hasText}
            className="shrink-0 w-[30px] h-[30px] flex items-center justify-center rounded-lg transition-all duration-200"
            style={{
              background: hasText ? "var(--accent)" : "var(--border)",
              color: hasText ? "var(--bg)" : "var(--text-muted)",
              opacity: hasText ? 1 : 0.5,
            }}
            aria-label="Add task"
          >
            <Plus size={15} strokeWidth={2.5} />
          </button>
        </div>
      </form>
    );
  }
);

TaskInput.displayName = "TaskInput";
