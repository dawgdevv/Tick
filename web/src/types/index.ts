// ─── Shared Types ─────────────────────────────────────────────────────────────

export type Priority = "high" | "normal" | "low";
export type RecurringType = "none" | "daily" | "weekly" | "weekdays";

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  completed: boolean;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  date: string;
  priority: Priority;
  recurring: boolean;
  recurring_type: RecurringType;
  timer_seconds: number;
  created_at: string;
  subtasks?: Subtask[];
}

export interface Scratchpad {
  id: number;
  content: string;
  updated_at: string;
}

export interface Quicklink {
  id: number;
  name: string;
  url: string;
  type: "bookmark" | "folder";
  parent_id: number | null;
  sort_order: number;
  created_at?: string;
}

export interface BookmarkNode extends Quicklink {
  children: BookmarkNode[];
}

export interface WeatherState {
  temp: number | null;
  condition: string;
  location: string;
  status: "idle" | "loading" | "ok" | "denied" | "error";
}

export type PomodoroMode = "work" | "break";
