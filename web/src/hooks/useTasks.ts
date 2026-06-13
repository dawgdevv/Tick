import { useState, useCallback, useEffect } from "react";
import type { Task, Priority, RecurringType, Subtask } from "@/types";

export function useTasks(date: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks?date=${date}`);
      if (res.ok) setTasks((await res.json()) ?? []);
    } catch { /* keep current state on network error */ }
  }, [date]);

  useEffect(() => {
    const run = async () => {
      await fetchTasks();
      setSelectedIdx(null);
    };
    void run();
  }, [fetchTasks]);

  const addTask = async (title: string, priority: Priority = "normal", recurring: boolean = false, recurringType: RecurringType = "none") => {
    if (!title.trim()) return;

    const optimistic: Task = {
      id: -Date.now(),
      title: title.trim(),
      completed: false,
      date,
      priority,
      recurring,
      recurring_type: recurringType,
      timer_seconds: 0,
      created_at: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), date, priority, recurring, recurring_type: recurringType }),
      });
      if (res.ok) {
        const created: Task = await res.json();
        setTasks((prev) =>
          prev.map((t) =>
            t.id === optimistic.id ? { ...created, subtasks: t.subtasks ?? [] } : t
          )
        );
      } else {
        setTasks((prev) => prev.filter((t) => t.id !== optimistic.id));
      }
    } catch {
      setTasks((prev) => prev.filter((t) => t.id !== optimistic.id));
      await fetchTasks();
    }
  };

  const toggleTask = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "PATCH" });
      if (res.ok) {
        const { completed } = await res.json();
        setTasks((p) => p.map((t) => (t.id === id ? { ...t, completed } : t)));
      } else {
        await fetchTasks();
      }
    } catch { await fetchTasks(); }
  }, [fetchTasks]);

  const deleteTask = useCallback(async (id: number) => {
    try {
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
      } else {
        await fetchTasks();
      }
    } catch { await fetchTasks(); }
  }, [fetchTasks]);

  const editTask = useCallback(async (id: number, title: string, priority?: Priority) => {
    if (!title.trim()) return;
    try {
      const body: Record<string, unknown> = { title: title.trim() };
      if (priority) body.priority = priority;
      const res = await fetch(`/api/tasks?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks((p) => p.map((t) => (t.id === id ? { ...t, ...updated } : t)));
      } else {
        await fetchTasks();
      }
    } catch { await fetchTasks(); }
  }, [fetchTasks]);

  // ─── Subtasks ───────────────────────────────────────────────────────────

  const addSubtask = useCallback(async (taskId: number, title: string) => {
    if (!title.trim() || taskId < 1) return;

    const trimmed = title.trim();
    const optimistic: Subtask = {
      id: -Date.now(),
      task_id: taskId,
      title: trimmed,
      completed: false,
      created_at: new Date().toISOString(),
    };

    setTasks((prev) =>
      prev.map((t) =>
        t.id !== taskId
          ? t
          : { ...t, subtasks: [...(t.subtasks || []), optimistic] }
      )
    );

    try {
      const res = await fetch(`/api/subtasks?task_id=${taskId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (res.ok) {
        const subtask = await res.json();
        setTasks((prev) =>
          prev.map((t) =>
            t.id !== taskId
              ? t
              : {
                  ...t,
                  subtasks: (t.subtasks || []).map((s) =>
                    s.id === optimistic.id ? subtask : s
                  ),
                }
          )
        );
      } else {
        setTasks((prev) =>
          prev.map((t) =>
            t.id !== taskId
              ? t
              : {
                  ...t,
                  subtasks: (t.subtasks || []).filter((s) => s.id !== optimistic.id),
                }
          )
        );
      }
    } catch {
      setTasks((prev) =>
        prev.map((t) =>
          t.id !== taskId
            ? t
            : {
                ...t,
                subtasks: (t.subtasks || []).filter((s) => s.id !== optimistic.id),
              }
        )
      );
    }
  }, []);

  const toggleSubtask = useCallback(async (subtaskId: number) => {
    if (subtaskId < 1) return;
    try {
      const res = await fetch(`/api/subtask?id=${subtaskId}`, { method: "PATCH" });
      if (res.ok) {
        const { completed } = await res.json();
        setTasks((p) => p.map((t) => {
          if (!t.subtasks?.length) return t;
          return {
            ...t,
            subtasks: t.subtasks.map((s) => s.id === subtaskId ? { ...s, completed } : s),
          };
        }));
      } else {
        await fetchTasks();
      }
    } catch { await fetchTasks(); }
  }, [fetchTasks]);

  const deleteSubtask = useCallback(async (subtaskId: number) => {
    if (subtaskId < 1) return;
    try {
      const res = await fetch(`/api/subtask?id=${subtaskId}`, { method: "DELETE" });
      if (res.ok) {
        setTasks((p) => p.map((t) => {
          if (!t.subtasks?.length) return t;
          return {
            ...t,
            subtasks: t.subtasks.filter((s) => s.id !== subtaskId),
          };
        }));
      } else {
        await fetchTasks();
      }
    } catch { await fetchTasks(); }
  }, [fetchTasks]);

  // ─── Timer ──────────────────────────────────────────────────────────────

  const updateTimer = useCallback(async (taskId: number, seconds: number) => {
    try {
      const res = await fetch(`/api/tasks/timer?id=${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seconds }),
      });
      if (res.ok) {
        setTasks((p) => p.map((t) => t.id === taskId ? { ...t, timer_seconds: seconds } : t));
      }
    } catch { /* silent fail */ }
  }, []);

  const done = tasks.filter((t) => t.completed).length;
  const taskProgress = tasks.length ? (done / tasks.length) * 100 : 0;

  return {
    tasks,
    selectedIdx,
    setSelectedIdx,
    addTask,
    toggleTask,
    deleteTask,
    editTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    updateTimer,
    done,
    taskProgress,
  };
}
