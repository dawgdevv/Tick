import { SignalHigh, SignalMedium, SignalLow } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Priority } from "@/types";

const PRIORITIES: {
  value: Priority;
  label: string;
  Icon: typeof SignalHigh;
  color: string;
  activeBg: string;
}[] = [
  {
    value: "high",
    label: "High",
    Icon: SignalHigh,
    color: "var(--error)",
    activeBg: "var(--error-bg)",
  },
  {
    value: "normal",
    label: "Normal",
    Icon: SignalMedium,
    color: "var(--accent)",
    activeBg: "var(--accent-bg)",
  },
  {
    value: "low",
    label: "Low",
    Icon: SignalLow,
    color: "var(--text-muted)",
    activeBg: "var(--bg-elevated)",
  },
];

interface PrioritySelectorProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  size?: "sm" | "md";
  className?: string;
}

export function PrioritySelector({
  value,
  onChange,
  size = "sm",
  className,
}: PrioritySelectorProps) {
  const btnSize = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const iconSize = size === "sm" ? 14 : 15;

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="group"
      aria-label="Priority"
    >
      {PRIORITIES.map(({ value: p, label, Icon, color, activeBg }) => {
        const active = value === p;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            title={label}
            aria-label={label}
            aria-pressed={active}
            className={cn(
              btnSize,
              "rounded-lg flex items-center justify-center border transition-colors duration-150",
              active
                ? "border-transparent"
                : "border-transparent bg-transparent hover:bg-[var(--panel-hover)]"
            )}
            style={{
              background: active ? activeBg : undefined,
              color: active ? color : "var(--text-faint)",
            }}
          >
            <Icon size={iconSize} strokeWidth={active ? 2.25 : 1.75} />
          </button>
        );
      })}
    </div>
  );
}
