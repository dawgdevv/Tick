import { useState, useEffect, useCallback } from "react";
import type { PomodoroMode } from "@/types";

const POM_WORK = 25 * 60;
const POM_BREAK = 5 * 60;

export function usePomodoro() {
  const [mode, setMode] = useState<PomodoroMode>("work");
  const [timeLeft, setTimeLeft] = useState(POM_WORK);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState<number>(() => {
    try {
      const raw = localStorage.getItem("tick-pom");
      if (!raw) return 0;
      const { date, count } = JSON.parse(raw) as { date: string; count: number };
      return new Date().toDateString() === date ? count : 0;
    } catch {
      return 0;
    }
  });

  const handleComplete = useCallback(() => {
    setRunning(false);
    if (mode === "work") {
      setSessions((s) => {
        const next = s + 1;
        localStorage.setItem(
          "tick-pom",
          JSON.stringify({ date: new Date().toDateString(), count: next })
        );
        return next;
      });
      setMode("break");
      setTimeLeft(POM_BREAK);
      return;
    }
    setMode("work");
    setTimeLeft(POM_WORK);
  }, [mode]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(
      () =>
        setTimeLeft((t) => {
          if (t <= 1) {
            handleComplete();
            return 0;
          }
          return t - 1;
        }),
      1000
    );
    return () => clearInterval(id);
  }, [running, handleComplete]);

  const reset = () => {
    setRunning(false);
    setTimeLeft(mode === "work" ? POM_WORK : POM_BREAK);
  };

  const total = mode === "work" ? POM_WORK : POM_BREAK;
  const progress = (total - timeLeft) / total;

  return {
    mode,
    timeLeft,
    running,
    sessions,
    progress,
    toggle: () => setRunning((r) => !r),
    reset,
  };
}
