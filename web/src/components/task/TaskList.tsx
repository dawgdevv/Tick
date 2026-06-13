import { TaskItem } from "./TaskItem";
import type { Task } from "@/types";

interface TaskListProps {
  tasks: Task[];
  selectedIdx: number | null;
  setSelectedIdx: (idx: number | null) => void;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number, title: string) => void;
  onAddSubtask: (taskId: number, title: string) => void;
  onToggleSubtask: (subtaskId: number) => void;
  onDeleteSubtask: (subtaskId: number) => void;
  onUpdateTimer: (taskId: number, seconds: number) => void;
}

export function TaskList({
  tasks,
  selectedIdx,
  setSelectedIdx,
  onToggle,
  onDelete,
  onEdit,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onUpdateTimer,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-[13px] text-[var(--text-muted)]">
            press <kbd className="px-2 py-0.5 rounded bg-[var(--panel)] text-[var(--text-secondary)] font-mono text-[11px] border border-[var(--border)]">n</kbd> to add a task
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto space-y-1">
      {tasks.map((task, i) => (
        <TaskItem
          key={task.id}
          task={task}
          index={i}
          selectedIdx={selectedIdx}
          onSelect={(idx) => setSelectedIdx(idx)}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          onAddSubtask={onAddSubtask}
          onToggleSubtask={onToggleSubtask}
          onDeleteSubtask={onDeleteSubtask}
          onUpdateTimer={onUpdateTimer}
        />
      ))}
    </div>
  );
}
