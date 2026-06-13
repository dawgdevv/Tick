import { Check, Trash2, Pencil, Plus, Timer, ChevronDown, ChevronRight, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect, useCallback } from "react";
import type { Task, Priority } from "@/types";

interface TaskItemProps {
  task: Task;
  index: number;
  selectedIdx: number | null;
  onSelect: (index: number | null) => void;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number, title: string, priority?: Priority) => void;
  onAddSubtask: (taskId: number, title: string) => void;
  onToggleSubtask: (subtaskId: number) => void;
  onDeleteSubtask: (subtaskId: number) => void;
  onUpdateTimer: (taskId: number, seconds: number) => void;
}

const priorityColors: Record<Priority, string> = {
  high: "var(--error)",
  normal: "var(--accent)",
  low: "var(--text-muted)",
};

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function TaskItem({
  task,
  index,
  selectedIdx,
  onSelect,
  onToggle,
  onDelete,
  onEdit,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onUpdateTimer,
}: TaskItemProps) {
  const isSelected = index === selectedIdx;
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);
  const [expanded, setExpanded] = useState(false);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(task.timer_seconds || 0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Sync timer from server
  useEffect(() => {
    setTimerSeconds(task.timer_seconds || 0);
  }, [task.timer_seconds]);

  // Timer interval
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => {
          const next = s + 1;
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerRunning]);

  // Save timer when stopping
  const handleTimerToggle = useCallback(() => {
    if (timerRunning) {
      // Stopping - save to server
      onUpdateTimer(task.id, timerSeconds);
    }
    setTimerRunning(!timerRunning);
  }, [timerRunning, timerSeconds, task.id, onUpdateTimer]);

  const handleDoubleClick = () => {
    if (!task.completed) {
      setEditing(true);
      setEditTitle(task.title);
      setEditPriority(task.priority);
    }
  };

  const handleSave = () => {
    if (editTitle.trim() && editTitle.trim() !== task.title) {
      onEdit(task.id, editTitle.trim(), editPriority);
    } else if (editPriority !== task.priority) {
      onEdit(task.id, task.title, editPriority);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskInput.trim()) return;
    onAddSubtask(task.id, subtaskInput.trim());
    setSubtaskInput("");
  };

  const subtaskDone = task.subtasks?.filter((s) => s.completed).length || 0;
  const subtaskTotal = task.subtasks?.length || 0;
  const hasSubtasks = subtaskTotal > 0;

  return (
    <div
      data-task-id={task.id}
      className={cn(
        "group rounded-xl transition-all duration-200",
        isSelected && !editing && "bg-[var(--accent-bg)] border border-[var(--accent-border)]",
        !isSelected && !editing && "hover:bg-[var(--panel)] border border-transparent",
        editing && "border border-[var(--accent-border)] bg-[var(--bg-elevated)]"
      )}
    >
      {/* Main Row */}
      <button
        onClick={() => onSelect(index === selectedIdx ? null : index)}
        onDoubleClick={handleDoubleClick}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer"
        aria-pressed={isSelected && !editing}
      >
        {/* Toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all duration-200"
          style={{
            background: task.completed ? "var(--accent)" : "transparent",
            borderColor: task.completed ? "var(--accent)" : "var(--border)",
          }}
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        >
          {task.completed && (
            <Check size={11} strokeWidth={3} className="text-[var(--bg)]" />
          )}
        </button>

        {/* Priority indicator */}
        {!task.completed && (
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: priorityColors[task.priority] }}
            title={`Priority: ${task.priority}`}
          />
        )}

        {/* Title or Edit Input */}
        {editing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-[var(--bg)] border border-[var(--accent-border)] rounded-lg px-3 py-1 text-[14px] text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as Priority)}
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] bg-[var(--bg)] text-[var(--text-secondary)] rounded px-2 py-1 outline-none border border-[var(--border)]"
            >
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        ) : (
          <span
            className={cn(
              "flex-1 text-[14px] leading-relaxed select-none transition-colors duration-200",
              task.completed
                ? "line-through text-[var(--text-faint)]"
                : "text-[var(--text)]"
            )}
          >
            {task.title}
          </span>
        )}

        {/* Meta info */}
        {!editing && (
          <div className="flex items-center gap-2 shrink-0">
            {/* Recurring badge */}
            {task.recurring && (
              <span className="flex items-center gap-1 text-[10px] text-[var(--accent)] bg-[var(--accent-bg)] px-1.5 py-0.5 rounded">
                <Repeat size={9} />
                {task.recurring_type}
              </span>
            )}

            {/* Subtask count */}
            {hasSubtasks && (
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                {subtaskDone}/{subtaskTotal}
              </span>
            )}

            {/* Timer */}
            <button
              onClick={(e) => { e.stopPropagation(); handleTimerToggle(); }}
              className={cn(
                "flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded transition-all duration-150",
                timerRunning
                  ? "text-[var(--accent)] bg-[var(--accent-bg)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
              title={timerRunning ? "Stop timer" : "Start timer"}
            >
              <Timer size={10} className={timerRunning ? "animate-pulse" : ""} />
              {formatTime(timerSeconds)}
            </button>

            {/* Expand */}
            {hasSubtasks && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--panel-hover)] transition-all duration-150"
              >
                {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        {!editing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              data-edit-btn
              onClick={(e) => { e.stopPropagation(); setEditing(true); setEditTitle(task.title); setEditPriority(task.priority); }}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] transition-all duration-200"
              aria-label="Edit task"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] transition-all duration-200"
              aria-label="Delete task"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </button>

      {/* Subtasks */}
      {(expanded || isSelected) && hasSubtasks && (
        <div className="px-4 pb-3 pl-14 space-y-1">
          {task.subtasks?.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center gap-2 group/subtask"
            >
              <button
                onClick={() => onToggleSubtask(subtask.id)}
                className="w-4 h-4 rounded-sm flex items-center justify-center shrink-0 border transition-all duration-150"
                style={{
                  background: subtask.completed ? "var(--accent)" : "transparent",
                  borderColor: subtask.completed ? "var(--accent)" : "var(--border)",
                }}
              >
                {subtask.completed && (
                  <Check size={8} strokeWidth={3} className="text-[var(--bg)]" />
                )}
              </button>
              <span
                className={cn(
                  "flex-1 text-[12px] transition-colors duration-150",
                  subtask.completed
                    ? "line-through text-[var(--text-faint)]"
                    : "text-[var(--text-secondary)]"
                )}
              >
                {subtask.title}
              </span>
              <button
                onClick={() => onDeleteSubtask(subtask.id)}
                className="opacity-0 group-hover/subtask:opacity-100 p-0.5 rounded text-[var(--text-faint)] hover:text-[var(--error)] transition-all duration-150"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
          
          {/* Add subtask input */}
          <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-1">
            <Plus size={10} className="text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              placeholder="Add subtask…"
              className="flex-1 bg-transparent outline-none text-[12px] text-[var(--text-secondary)] placeholder:text-[var(--text-faint)] py-1"
              onClick={(e) => e.stopPropagation()}
            />
          </form>
        </div>
      )}

      {/* Add subtask when selected but no subtasks yet */}
      {isSelected && !hasSubtasks && !editing && (
        <div className="px-4 pb-3 pl-14">
          <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
            <Plus size={10} className="text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              placeholder="Add subtask…"
              className="flex-1 bg-transparent outline-none text-[12px] text-[var(--text-secondary)] placeholder:text-[var(--text-faint)] py-1"
              onClick={(e) => e.stopPropagation()}
            />
          </form>
        </div>
      )}
    </div>
  );
}
