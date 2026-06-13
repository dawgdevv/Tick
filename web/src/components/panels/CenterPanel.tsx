import { useState, forwardRef } from "react";
import { TaskList } from "@/components/task/TaskList";
import { TaskInput } from "@/components/task/TaskInput";
import type { Task, Priority, RecurringType } from "@/types";

interface CenterPanelProps {
  tasks: Task[];
  selectedIdx: number | null;
  setSelectedIdx: (idx: number | null) => void;
  onToggleTask: (id: number) => void;
  onDeleteTask: (id: number) => void;
  onAddTask: (title: string, priority: Priority, recurring: boolean, recurringType: RecurringType) => void;
  onEditTask: (id: number, title: string, priority?: Priority) => void;
  onAddSubtask: (taskId: number, title: string) => void;
  onToggleSubtask: (subtaskId: number) => void;
  onDeleteSubtask: (subtaskId: number) => void;
  onUpdateTimer: (taskId: number, seconds: number) => void;
}

export const CenterPanel = forwardRef<HTMLInputElement, CenterPanelProps>(
  ({
    tasks,
    selectedIdx,
    setSelectedIdx,
    onToggleTask,
    onDeleteTask,
    onAddTask,
    onEditTask,
    onAddSubtask,
    onToggleSubtask,
    onDeleteSubtask,
    onUpdateTimer,
  }, ref) => {
    const [newTask, setNewTask] = useState("");
    const [priority, setPriority] = useState<Priority>("normal");
    const [recurring, setRecurring] = useState(false);
    const [recurringType, setRecurringType] = useState<RecurringType>("none");

    const handleSubmit = () => {
      if (!newTask.trim()) return;
      onAddTask(newTask.trim(), priority, recurring, recurringType);
      setNewTask("");
      setPriority("normal");
      setRecurring(false);
      setRecurringType("none");
    };

    return (
      <div className="h-full flex flex-col bg-[var(--bg)]">
        {/* Task List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-2 pt-4">
          <TaskList
            tasks={tasks}
            selectedIdx={selectedIdx}
            setSelectedIdx={setSelectedIdx}
            onToggle={onToggleTask}
            onDelete={onDeleteTask}
            onEdit={onEditTask}
            onAddSubtask={onAddSubtask}
            onToggleSubtask={onToggleSubtask}
            onDeleteSubtask={onDeleteSubtask}
            onUpdateTimer={onUpdateTimer}
          />
        </div>

        {/* Add Task Input */}
        <footer className="shrink-0 px-6 py-5 border-t border-[var(--divider)] bg-[var(--bg)]">
          <TaskInput
            ref={ref}
            value={newTask}
            onChange={setNewTask}
            onSubmit={handleSubmit}
            priority={priority}
            onPriorityChange={setPriority}
            recurring={recurring}
            onRecurringChange={setRecurring}
            recurringType={recurringType}
            onRecurringTypeChange={setRecurringType}
          />
        </footer>
      </div>
    );
  }
);

CenterPanel.displayName = "CenterPanel";
