import { Plus } from "lucide-react";
import { forwardRef, useState } from "react";
import { PrioritySelector } from "@/components/ui/PrioritySelector";
import { RecurringSelector } from "@/components/ui/RecurringSelector";
import { cn } from "@/lib/utils";
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

export const TaskInput = forwardRef<HTMLInputElement, TaskInputProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      priority,
      onPriorityChange,
      recurring,
      onRecurringChange,
      recurringType,
      onRecurringTypeChange,
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const hasText = value.trim().length > 0;
    const showToolbar = focused || hasText;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!hasText) return;
      onSubmit();
    };

    const handleRecurringToggle = (enabled: boolean) => {
      onRecurringChange(enabled);
      if (enabled && recurringType === "none") {
        onRecurringTypeChange("daily");
      }
      if (!enabled) {
        onRecurringTypeChange("none");
      }
    };

    const handleRecurringType = (type: RecurringType) => {
      onRecurringTypeChange(type);
      if (type !== "none") {
        onRecurringChange(true);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="max-w-[640px] mx-auto">
        <div
          className={cn(
            "rounded-xl border border-[var(--border-subtle)] bg-[var(--panel)] transition-colors duration-200",
            focused && "border-[var(--border)]"
          )}
        >
          {/* Input row — matches task item layout */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div
              className="w-5 h-5 rounded-md shrink-0 border border-[var(--border)] bg-transparent"
              aria-hidden="true"
            />

            <input
              ref={ref}
              type="text"
              name="task"
              autoComplete="off"
              spellCheck={false}
              placeholder="What do you need to do?"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="task-compose-input"
            />

            <button
              type="submit"
              disabled={!hasText}
              className={cn(
                "shrink-0 h-8 w-8 flex items-center justify-center rounded-lg transition-opacity duration-200",
                hasText
                  ? "bg-[var(--accent)] text-[var(--bg)] hover:opacity-85"
                  : "bg-[var(--border-subtle)] text-[var(--text-faint)] opacity-40 cursor-not-allowed"
              )}
              aria-label="Add task"
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* Options toolbar */}
          {showToolbar && (
            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pb-3 pt-3 border-t border-[var(--divider)] mx-3"
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-faint)] font-medium w-14 shrink-0">
                  Priority
                </span>
                <PrioritySelector
                  value={priority}
                  onChange={onPriorityChange}
                />
              </div>

              <div className="w-px h-6 bg-[var(--divider)] shrink-0 hidden sm:block" />

              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-faint)] font-medium w-14 shrink-0">
                  Repeat
                </span>
                <RecurringSelector
                  enabled={recurring}
                  onEnabledChange={handleRecurringToggle}
                  type={recurringType}
                  onTypeChange={handleRecurringType}
                />
              </div>
            </div>
          )}
        </div>
      </form>
    );
  }
);

TaskInput.displayName = "TaskInput";
