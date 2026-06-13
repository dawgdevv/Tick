import { Repeat, Sun, Briefcase, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecurringType } from "@/types";

const RECURRING_OPTIONS: {
  value: Exclude<RecurringType, "none">;
  label: string;
  Icon: typeof Sun;
}[] = [
  { value: "daily", label: "Daily", Icon: Sun },
  { value: "weekdays", label: "Weekdays", Icon: Briefcase },
  { value: "weekly", label: "Weekly", Icon: CalendarRange },
];

interface RecurringSelectorProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  type: RecurringType;
  onTypeChange: (type: RecurringType) => void;
  className?: string;
}

export function RecurringSelector({
  enabled,
  onEnabledChange,
  type,
  onTypeChange,
  className,
}: RecurringSelectorProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        type="button"
        onClick={() => onEnabledChange(!enabled)}
        title={enabled ? "Repeating" : "Repeat"}
        aria-label={enabled ? "Disable repeat" : "Enable repeat"}
        aria-pressed={enabled}
        className={cn(
          "h-7 w-7 shrink-0 rounded-lg flex items-center justify-center border transition-colors duration-150",
          enabled
            ? "border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent)]"
            : "border-transparent text-[var(--text-faint)] hover:bg-[var(--panel-hover)] hover:text-[var(--text-muted)]"
        )}
      >
        <Repeat size={14} strokeWidth={enabled ? 2.25 : 1.75} />
      </button>

      {enabled && (
        <div
          className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
          role="group"
          aria-label="Repeat frequency"
        >
          {RECURRING_OPTIONS.map(({ value, label, Icon }) => {
            const active = type === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onTypeChange(value)}
                title={label}
                aria-label={label}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors duration-150",
                  active
                    ? "bg-[var(--panel)] text-[var(--accent)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                )}
              >
                <Icon size={11} strokeWidth={active ? 2.25 : 1.75} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
