import { format } from "date-fns";
import { MapPin, Play, Pause, RotateCcw } from "lucide-react";
import type { WeatherState, Scratchpad } from "@/types";

interface LeftPanelProps {
  time: Date;
  weather: WeatherState;
  pomodoro: {
    mode: "work" | "break";
    timeLeft: number;
    running: boolean;
    sessions: number;
    progress: number;
    toggle: () => void;
    reset: () => void;
  };
  tasksDone: number;
  totalTasks: number;
  taskProgress: number;
  scratchpad: Scratchpad | null;
  onUpdateScratchpad: (content: string) => void;
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

export function LeftPanel({
  time,
  weather,
  pomodoro,
  tasksDone,
  totalTasks,
  taskProgress,
  scratchpad,
  onUpdateScratchpad,
}: LeftPanelProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Clock */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[2.5rem] font-light tracking-tight text-[var(--text)] leading-none">
            {format(time, "HH:mm")}
          </span>
          <span className="font-mono text-sm text-[var(--text-muted)]">
            :{format(time, "ss")}
          </span>
        </div>
        <div className="mt-4 space-y-1">
          <div className="text-[12px] text-[var(--accent)] font-medium tracking-wide uppercase">
            {format(time, "EEEE")}
          </div>
          <div className="text-[12px] text-[var(--text-secondary)]">
            {format(time, "MMMM d, yyyy")}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-[var(--divider)]" />

      {/* Weather */}
      <div className="px-6 py-4 min-h-[80px] flex flex-col justify-center">
        {weather.status === "loading" && (
          <span className="text-[11px] text-[var(--text-faint)] animate-pulse">
            locating…
          </span>
        )}
        {weather.status === "denied" && (
          <span className="text-[11px] text-[var(--text-faint)]">
            location denied
          </span>
        )}
        {weather.status === "error" && (
          <span className="text-[11px] text-[var(--text-faint)]">
            weather unavailable
          </span>
        )}
        {weather.status === "ok" && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <MapPin size={11} className="text-[var(--text-muted)] shrink-0" />
              <span className="text-[11px] text-[var(--text-secondary)] truncate">
                {weather.location}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[1.5rem] font-light text-[var(--text)]">
                {weather.temp}°
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                {weather.condition}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-[var(--divider)]" />

      {/* Pomodoro */}
      <div className="px-6 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.15em] transition-colors"
            style={{ color: pomodoro.mode === "work" ? "var(--accent)" : "var(--info)" }}
          >
            {pomodoro.mode === "work" ? "focus" : "break"}
          </span>
          <span className="font-mono text-lg font-light text-[var(--text)]">
            {pad2(Math.floor(pomodoro.timeLeft / 60))}:{pad2(pomodoro.timeLeft % 60)}
          </span>
        </div>

        <div className="h-1 bg-[var(--border)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-1000 ease-linear"
            style={{
              width: `${pomodoro.progress * 100}%`,
              background: pomodoro.mode === "work" ? "var(--accent)" : "var(--info)",
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={pomodoro.toggle}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--panel-hover)] transition-colors duration-150"
            aria-label={pomodoro.running ? "Pause" : "Start"}
          >
            {pomodoro.running ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={pomodoro.reset}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--panel-hover)] transition-colors duration-150"
            aria-label="Reset"
          >
            <RotateCcw size={13} />
          </button>

          <div className="flex items-center gap-1.5 ml-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-colors duration-300"
                style={{
                  background: i < pomodoro.sessions % 4 ? "var(--accent)" : "var(--border)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-[var(--divider)]" />

      {/* Task Progress */}
      {totalTasks > 0 && (
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] font-medium">
              progress
            </span>
            <span className="font-mono text-[12px] text-[var(--accent)]">
              {tasksDone}/{totalTasks}
            </span>
          </div>
          <div className="h-1 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${taskProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Scratchpad */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-6 pt-4 pb-2">
          <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] font-medium">
            scratchpad
          </span>
        </div>
        <div className="px-6 pb-4 flex-1 min-h-0">
          <textarea
            value={scratchpad?.content || ""}
            onChange={(e) => onUpdateScratchpad(e.target.value)}
            placeholder="Jot down quick notes…"
            className="w-full h-full bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)] p-3 text-[12px] text-[var(--text-secondary)] placeholder:text-[var(--text-faint)] outline-none resize-none focus:border-[var(--accent)] transition-colors duration-200 custom-scrollbar"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="px-6 py-5 border-t border-[var(--divider)] shrink-0">
        <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] font-medium mb-3">
          shortcuts
        </div>
        <div className="space-y-2">
          {[
            ["n", "new task"],
            ["j / k", "navigate"],
            ["x", "toggle done"],
            ["d", "delete"],
            ["e", "edit"],
            ["[ / ]", "sidebars"],
          ].map(([k, label]) => (
            <div key={k} className="flex items-center gap-3">
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] min-w-[40px] text-center border border-[var(--border)]">
                {k}
              </kbd>
              <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
