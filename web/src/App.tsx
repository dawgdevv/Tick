import { useState, useEffect, useCallback, useRef } from "react";
import { format, addDays, subDays } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Check,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  MapPin,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: number;
  title: string;
  completed: boolean;
  date: string;
}

interface Quicklink {
  id: number;
  name: string;
  url: string;
}

interface WeatherState {
  temp: number | null;
  condition: string;
  location: string;
  status: "idle" | "loading" | "ok" | "denied" | "error";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wmoCondition(code: number): string {
  if (code === 0) return "clear sky";
  if (code <= 2) return "partly cloudy";
  if (code === 3) return "overcast";
  if (code <= 48) return "foggy";
  if (code <= 55) return "drizzle";
  if (code <= 65) return "rain";
  if (code <= 75) return "snow";
  if (code <= 82) return "showers";
  if (code <= 95) return "thunderstorm";
  return "—";
}

const POM_WORK = 25 * 60;
const POM_BREAK = 5 * 60;

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [quicklinks, setQuicklinks] = useState<Quicklink[]>([]);
  const [newTask, setNewTask] = useState("");
  const [time, setTime] = useState(new Date());
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [qlOpen, setQlOpen] = useState(false);
  const [qlName, setQlName] = useState("");
  const [qlUrl, setQlUrl] = useState("");

  // Weather
  const [weather, setWeather] = useState<WeatherState>({
    temp: null,
    condition: "",
    location: "",
    status: "idle",
  });

  // Pomodoro — session count persists per calendar day
  const [pomMode, setPomMode] = useState<"work" | "break">("work");
  const [pomTime, setPomTime] = useState(POM_WORK);
  const [pomRunning, setPomRunning] = useState(false);
  const [pomSessions, setPomSessions] = useState<number>(() => {
    try {
      const raw = localStorage.getItem("tick-pom");
      if (!raw) return 0;
      const { date, count } = JSON.parse(raw) as { date: string; count: number };
      return new Date().toDateString() === date ? count : 0;
    } catch {
      return 0;
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const formattedDate = format(currentDate, "yyyy-MM-dd");

  // ── Clock ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Weather (once on mount) ────────────────────────────────────────────────
  useEffect(() => {
    setWeather((w) => ({ ...w, status: "loading" }));

    if (!navigator.geolocation) {
      setWeather((w) => ({ ...w, status: "error" }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        try {
          const [wRes, gRes] = await Promise.all([
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
            ),
            fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
            ),
          ]);
          const wData = await wRes.json();
          const gData = await gRes.json();
          const city =
            gData.address?.city ||
            gData.address?.town ||
            gData.address?.village ||
            gData.address?.county ||
            "—";
          setWeather({
            temp: Math.round(wData.current.temperature_2m),
            condition: wmoCondition(wData.current.weather_code),
            location: city,
            status: "ok",
          });
        } catch {
          setWeather((w) => ({ ...w, status: "error" }));
        }
      },
      () => setWeather((w) => ({ ...w, status: "denied" })),
      { timeout: 10000 }
    );
  }, []);

  // ── Pomodoro tick ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pomRunning) return;
    const id = setInterval(
      () => setPomTime((t) => Math.max(0, t - 1)),
      1000
    );
    return () => clearInterval(id);
  }, [pomRunning]);

  // Switch mode when timer expires
  useEffect(() => {
    if (pomTime > 0 || !pomRunning) return;
    setPomRunning(false);
    if (pomMode === "work") {
      // Use functional update so pomSessions isn't a dep
      setPomSessions((s) => {
        const next = s + 1;
        localStorage.setItem(
          "tick-pom",
          JSON.stringify({ date: new Date().toDateString(), count: next })
        );
        return next;
      });
      setPomMode("break");
      setPomTime(POM_BREAK);
    } else {
      setPomMode("work");
      setPomTime(POM_WORK);
    }
  }, [pomTime, pomRunning, pomMode]);

  const resetPom = () => {
    setPomRunning(false);
    setPomTime(pomMode === "work" ? POM_WORK : POM_BREAK);
  };

  const pomTotal = pomMode === "work" ? POM_WORK : POM_BREAK;
  const pomProgress = (pomTotal - pomTime) / pomTotal;

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks?date=${formattedDate}`);
      if (res.ok) setTasks((await res.json()) ?? []);
    } catch { /* keep current state on network error */ }
  }, [formattedDate]);

  const fetchQuicklinks = useCallback(async () => {
    try {
      const res = await fetch("/api/quicklinks");
      if (res.ok) setQuicklinks((await res.json()) ?? []);
    } catch { /* keep current state on network error */ }
  }, []);

  useEffect(() => {
    fetchTasks();
    setSelectedIdx(null);
  }, [fetchTasks]);

  useEffect(() => { fetchQuicklinks(); }, [fetchQuicklinks]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTask.trim(), date: formattedDate }),
    });
    if (res.ok) { setNewTask(""); fetchTasks(); }
  };

  const toggleTask = useCallback(async (id: number) => {
    const res = await fetch(`/api/tasks?id=${id}`, { method: "PATCH" });
    if (res.ok) {
      const { completed } = await res.json();
      setTasks((p) => p.map((t) => (t.id === id ? { ...t, completed } : t)));
    }
  }, []);

  const deleteTask = useCallback(async (id: number) => {
    const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setTasks((prev) => {
        const di = prev.findIndex((t) => t.id === id);
        const next = prev.filter((t) => t.id !== id);
        setSelectedIdx((si) => {
          if (si === null) return null;
          if (di < si) return si - 1;
          if (di === si) return next.length ? Math.min(si, next.length - 1) : null;
          return si;
        });
        return next;
      });
    }
  }, []);

  const addQuicklink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qlName.trim() || !qlUrl.trim()) return;
    const url = /^https?:\/\//i.test(qlUrl.trim())
      ? qlUrl.trim()
      : `https://${qlUrl.trim()}`;
    const res = await fetch("/api/quicklinks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: qlName.trim(), url }),
    });
    if (res.ok) { setQlName(""); setQlUrl(""); setQlOpen(false); fetchQuicklinks(); }
  };

  const deleteQuicklink = async (id: number) => {
    const res = await fetch(`/api/quicklinks?id=${id}`, { method: "DELETE" });
    if (res.ok) setQuicklinks((p) => p.filter((l) => l.id !== id));
  };

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
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
        setQlOpen(false);
        return;
      }
      if (typing) return;

      switch (e.key) {
        case "n":
          e.preventDefault();
          inputRef.current?.focus();
          break;
        case "j":
        case "ArrowDown":
          e.preventDefault();
          setSelectedIdx((p) =>
            p === null ? 0 : Math.min(p + 1, tasks.length - 1)
          );
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          setSelectedIdx((p) =>
            p === null ? tasks.length - 1 : Math.max(p - 1, 0)
          );
          break;
        case "x":
          if (selectedIdx !== null && tasks[selectedIdx])
            toggleTask(tasks[selectedIdx].id);
          break;
        case "d":
          if (selectedIdx !== null && tasks[selectedIdx])
            deleteTask(tasks[selectedIdx].id);
          break;
      }
    };

    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [tasks, selectedIdx, toggleTask, deleteTask]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const done = tasks.filter((t) => t.completed).length;
  const taskProgress = tasks.length ? (done / tasks.length) * 100 : 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">

      {/* ═══════════════════════════════════════════
          LEFT PANEL
      ════════════════════════════════════════════ */}
      <aside
        className="w-[220px] shrink-0 flex flex-col bg-[var(--panel)]"
        style={{
          borderRight: "1px solid var(--border)",
          boxShadow: "1px 0 0 rgba(255,255,255,0.028), 4px 0 20px rgba(0,0,0,0.4)",
        }}
      >
        {/* ── Clock ──────────────────────────────── */}
        <div className="px-5 pt-7 pb-4">
          <div className="font-mono text-[2.75rem] font-light leading-none tracking-tight text-[var(--text)]">
            {format(time, "HH:mm")}
          </div>
          <div className="font-mono text-xs text-[var(--muted)] mt-1 leading-none">
            :{format(time, "ss")}
          </div>
          <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
            {format(time, "EEE")}
          </div>
          <div className="text-xs text-[var(--secondary)] mt-0.5">
            {format(time, "MMM d, yyyy")}
          </div>
        </div>

        <div className="mx-5 border-t border-[var(--border)]" />

        {/* ── Weather + Location ─────────────────── */}
        <div className="px-5 py-4 min-h-[72px] flex flex-col justify-center">
          {weather.status === "loading" && (
            <span className="font-mono text-[10px] text-[var(--faint)] animate-pulse">
              locating...
            </span>
          )}
          {weather.status === "denied" && (
            <span className="font-mono text-[10px] text-[var(--faint)]">
              location denied
            </span>
          )}
          {weather.status === "error" && (
            <span className="font-mono text-[10px] text-[var(--faint)]">
              weather unavailable
            </span>
          )}
          {weather.status === "ok" && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <MapPin size={10} className="text-[var(--muted)] shrink-0" />
                <span className="text-[11px] text-[var(--secondary)] truncate">
                  {weather.location}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[1.75rem] font-light leading-none text-[var(--text)]">
                  {weather.temp}°
                </span>
                <span className="text-[11px] text-[var(--muted)]">
                  {weather.condition}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mx-5 border-t border-[var(--border)]" />

        {/* ── Pomodoro Timer ─────────────────────── */}
        <div className="px-5 py-4 space-y-2.5">
          {/* Label + time */}
          <div className="flex items-center justify-between">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em] transition-colors"
              style={{ color: pomMode === "work" ? "var(--accent)" : "var(--blue)" }}
            >
              {pomMode === "work" ? "focus" : "break"}
            </span>
            <span className="font-mono text-sm font-light text-[var(--text)]">
              {pad2(Math.floor(pomTime / 60))}:{pad2(pomTime % 60)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-[2px] bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-1000 ease-linear"
              style={{
                width: `${pomProgress * 100}%`,
                background: pomMode === "work" ? "var(--accent)" : "var(--blue)",
              }}
            />
          </div>

          {/* Controls + session dots */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPomRunning((r) => !r)}
              className="w-6 h-6 flex items-center justify-center rounded text-[var(--secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] transition-all duration-150"
              aria-label={pomRunning ? "Pause" : "Start"}
            >
              {pomRunning ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <button
              onClick={resetPom}
              className="w-6 h-6 flex items-center justify-center rounded text-[var(--muted)] hover:text-[var(--secondary)] hover:bg-[var(--hover)] transition-all duration-150"
              aria-label="Reset"
            >
              <RotateCcw size={11} />
            </button>

            {/* 4-dot session tracker — resets each full cycle of 4 */}
            <div className="flex items-center gap-1 ml-auto">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    background:
                      i < pomSessions % 4
                        ? "var(--accent)"
                        : "var(--border)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1" />

        {/* ── Task progress ──────────────────────── */}
        {tasks.length > 0 && (
          <>
            <div className="mx-5 border-t border-[var(--border)]" />
            <div className="px-5 py-4">
              <div className="flex justify-between items-center mb-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">
                  done
                </span>
                <span className="font-mono text-[11px] text-[var(--accent)]">
                  {done}/{tasks.length}
                </span>
              </div>
              <div className="h-[2px] bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${taskProgress}%` }}
                />
              </div>
            </div>
          </>
        )}

        {/* ── Keyboard reference ─────────────────── */}
        <div className="px-5 py-5 border-t border-[var(--border)]">
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--muted)] mb-3">
            keys
          </div>
          <div className="space-y-1.5">
            {[
              ["n", "new task"],
              ["j / k", "navigate"],
              ["x", "toggle"],
              ["d", "delete"],
              ["⎋", "deselect"],
            ].map(([k, label]) => (
              <div key={k} className="flex items-center gap-2.5">
                <code className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--secondary)] min-w-[34px] text-center">
                  {k}
                </code>
                <span className="text-[10px] text-[var(--muted)]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════
          CENTER PANEL — Tasks
      ════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Date navigation */}
        <header className="h-12 flex items-center justify-between px-8 border-b border-[var(--border)] shrink-0">
          <button
            onClick={() => setCurrentDate(subDays(currentDate, 1))}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--hover)] transition-all duration-150"
            aria-label="Previous day"
          >
            <ChevronLeft size={14} />
          </button>

          <span className="font-mono text-[11px] tracking-[0.25em] text-[var(--secondary)] select-none">
            {format(currentDate, "dd · MM · yyyy")}
          </span>

          <button
            onClick={() => setCurrentDate(addDays(currentDate, 1))}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--hover)] transition-all duration-150"
            aria-label="Next day"
          >
            <ChevronRight size={14} />
          </button>
        </header>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-5 px-8">
          {tasks.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="font-mono text-xs text-[var(--faint)]">
                press{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--muted)] mx-0.5">
                  n
                </kbd>{" "}
                to add a task
              </p>
            </div>
          ) : (
            <div className="max-w-[620px] mx-auto space-y-px">
              {tasks.map((task, i) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedIdx(i === selectedIdx ? null : i)}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-100 task-enter",
                    i !== selectedIdx && "hover:bg-[var(--hover)]"
                  )}
                  style={{
                    background:
                      i === selectedIdx ? "var(--selected-bg)" : undefined,
                    borderLeft:
                      i === selectedIdx
                        ? "2px solid var(--accent)"
                        : "2px solid transparent",
                  }}
                >
                  {/* Toggle button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                    className="w-[15px] h-[15px] rounded-[3px] flex items-center justify-center shrink-0 border transition-all duration-150"
                    style={{
                      background: task.completed ? "var(--accent)" : "transparent",
                      borderColor: task.completed ? "var(--accent)" : "var(--faint)",
                    }}
                    aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                  >
                    {task.completed && (
                      <Check
                        size={9}
                        strokeWidth={3}
                        style={{ color: "var(--bg)" }}
                      />
                    )}
                  </button>

                  {/* Title */}
                  <span
                    className={cn(
                      "flex-1 text-sm leading-relaxed transition-all duration-150 select-none",
                      task.completed
                        ? "line-through text-[var(--faint)]"
                        : "text-[var(--text)]"
                    )}
                  >
                    {task.title}
                  </span>

                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--muted)] hover:text-[var(--red)] transition-all duration-150"
                    aria-label="Delete task"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add task */}
        <footer className="shrink-0 px-8 py-4 border-t border-[var(--border)]">
          <form onSubmit={addTask} className="flex gap-2.5 max-w-[620px] mx-auto">
            <input
              ref={inputRef}
              type="text"
              placeholder="add task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className="flex-1 bg-transparent border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm outline-none placeholder:text-[var(--faint)] text-[var(--text)] focus:border-[var(--accent)] transition-colors duration-150"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg flex items-center text-sm transition-all duration-150 text-[var(--accent)] bg-[var(--accent-bg)] border border-[var(--accent-border)] hover:bg-[var(--accent-hover)]"
              aria-label="Add task"
            >
              <Plus size={15} />
            </button>
          </form>
        </footer>
      </main>

      {/* ═══════════════════════════════════════════
          RIGHT PANEL — Quicklinks
      ════════════════════════════════════════════ */}
      <aside
        className="w-[216px] shrink-0 flex flex-col bg-[var(--panel)]"
        style={{
          borderLeft: "1px solid var(--border)",
          boxShadow: "-1px 0 0 rgba(255,255,255,0.028), -4px 0 20px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
            links
          </span>

          <Dialog.Root
            open={qlOpen}
            onOpenChange={(open) => {
              setQlOpen(open);
              if (!open) { setQlName(""); setQlUrl(""); }
            }}
          >
            <Dialog.Trigger asChild>
              <button
                className="w-6 h-6 flex items-center justify-center rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--hover)] transition-all duration-150"
                aria-label="Add quicklink"
              >
                <Plus size={13} />
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 animate-overlay-in" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[312px] rounded-xl p-6 shadow-2xl animate-fade-in bg-[var(--panel)] border border-[var(--border)]">
                <div className="flex items-center justify-between mb-5">
                  <Dialog.Title className="text-sm font-medium text-[var(--text)]">
                    add link
                  </Dialog.Title>
                  <Dialog.Close className="w-6 h-6 flex items-center justify-center rounded text-[var(--muted)] hover:text-[var(--text)] transition-colors">
                    <X size={13} />
                  </Dialog.Close>
                </div>

                <Dialog.Description className="sr-only">
                  Add a new quicklink with a name and URL.
                </Dialog.Description>

                <form onSubmit={addQuicklink} className="space-y-3">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)] mb-1.5">
                      name
                    </label>
                    <input
                      type="text"
                      placeholder="GitHub"
                      value={qlName}
                      onChange={(e) => setQlName(e.target.value)}
                      autoFocus
                      className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none text-[var(--text)] placeholder:text-[var(--faint)] focus:border-[var(--accent)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)] mb-1.5">
                      url
                    </label>
                    <input
                      type="text"
                      placeholder="github.com"
                      value={qlUrl}
                      onChange={(e) => setQlUrl(e.target.value)}
                      className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none text-[var(--text)] placeholder:text-[var(--faint)] focus:border-[var(--accent)] transition-colors"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="flex-1 py-2 rounded-lg text-sm text-[var(--muted)] bg-[var(--hover)] hover:text-[var(--text)] transition-all"
                      >
                        cancel
                      </button>
                    </Dialog.Close>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-lg text-sm font-medium text-[var(--accent)] bg-[var(--accent-bg)] border border-[var(--accent-border)] hover:bg-[var(--accent-hover)] transition-all"
                    >
                      save
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        {/* Links */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-px">
          {quicklinks.length === 0 ? (
            <div className="py-8 text-center font-mono text-[10px] text-[var(--faint)]">
              empty
            </div>
          ) : (
            quicklinks.map((link, i) => (
              <div
                key={link.id}
                className="group flex items-center gap-2 px-2 py-2 rounded-md hover:bg-[var(--hover)] transition-all duration-150"
              >
                <span className="font-mono text-[10px] w-4 text-right text-[var(--faint)] shrink-0 select-none">
                  {i + 1}
                </span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-xs text-[var(--secondary)] hover:text-[var(--text)] truncate transition-colors duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  {link.name}
                </a>
                <button
                  onClick={() => deleteQuicklink(link.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[var(--muted)] hover:text-[var(--red)] transition-all duration-150"
                  aria-label="Remove link"
                >
                  <X size={10} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

export default App;
