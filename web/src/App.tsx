import { useState, useRef, useEffect } from "react";
import { format, addDays, subDays } from "date-fns";

import { useClock } from "@/hooks/useClock";
import { useWeather } from "@/hooks/useWeather";
import { usePomodoro } from "@/hooks/usePomodoro";
import { useTasks } from "@/hooks/useTasks";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useScratchpad } from "@/hooks/useScratchpad";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

import { LeftPanel } from "@/components/panels/LeftPanel";
import { CenterPanel } from "@/components/panels/CenterPanel";
import { RightPanel } from "@/components/panels/RightPanel";
import { Calendar } from "@/components/Calendar";

import { ChevronLeft, ChevronRight, ChevronDown, CalendarDays } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";

function App() {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const formattedDate = format(currentDate, "yyyy-MM-dd");

  const time = useClock();
  const weather = useWeather();
  const pomodoro = usePomodoro();
  const tasks = useTasks(formattedDate);
  const bookmarks = useBookmarks();
  const scratchpad = useScratchpad();

  const inputRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcuts({
    tasksLength: tasks.tasks.length,
    selectedIdx: tasks.selectedIdx,
    setSelectedIdx: tasks.setSelectedIdx,
    onNewTask: () => inputRef.current?.focus(),
    onToggle: () => {
      if (tasks.selectedIdx !== null && tasks.tasks[tasks.selectedIdx]) {
        tasks.toggleTask(tasks.tasks[tasks.selectedIdx].id);
      }
    },
    onDelete: () => {
      if (tasks.selectedIdx !== null && tasks.tasks[tasks.selectedIdx]) {
        tasks.deleteTask(tasks.tasks[tasks.selectedIdx].id);
      }
    },
    onEdit: () => {
      if (tasks.selectedIdx !== null && tasks.tasks[tasks.selectedIdx]) {
        const selectedTask = document.querySelector(`[data-task-id="${tasks.tasks[tasks.selectedIdx].id}"]`);
        if (selectedTask) {
          const editBtn = selectedTask.querySelector('[data-edit-btn]') as HTMLButtonElement;
          editBtn?.click();
        }
      }
    },
    onEscape: () => {},
  });

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement;
      const typing = el.tagName === "INPUT" || el.tagName === "TEXTAREA";
      if (typing) return;
      if (e.key === "[") { e.preventDefault(); setLeftOpen((p) => !p); }
      else if (e.key === "]") { e.preventDefault(); setRightOpen((p) => !p); }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  return (
    <div className="h-screen w-screen bg-[var(--bg)] text-[var(--text)] overflow-hidden flex flex-col">
      {/* Top Header */}
      <header className="h-[var(--header-height)] shrink-0 flex items-center justify-between px-4 z-30 relative">
        {/* Left: Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLeftOpen(!leftOpen)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${
              leftOpen
                ? "bg-[var(--panel)] text-[var(--accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--panel)]"
            }`}
            aria-label={leftOpen ? "Close sidebar" : "Open sidebar"}
          >
            <ChevronLeft size={16} className={`transition-transform duration-200 ${leftOpen ? "rotate-180" : ""}`} />
          </button>
          <span className="text-sm font-medium text-[var(--text-secondary)] tracking-tight">
            tick
          </span>
        </div>

        {/* Center: Calendar Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentDate(subDays(currentDate, 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--panel)] transition-all duration-200"
            aria-label="Previous day"
          >
            <ChevronLeft size={14} />
          </button>

          <Popover.Root open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <Popover.Trigger asChild>
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--panel)] transition-all duration-200 group"
                aria-label="Pick a date"
              >
                <CalendarDays size={13} className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors" />
                <span className="font-mono text-[12px] tracking-wider text-[var(--text-secondary)] group-hover:text-[var(--text)] select-none transition-colors">
                  {format(currentDate, "dd · MM · yyyy")}
                </span>
                <ChevronDown size={11} className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors" />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="z-50 bg-[var(--panel)] border border-[var(--border)] rounded-xl shadow-2xl animate-fade-in mt-1"
                align="center"
                sideOffset={4}
              >
                <Calendar
                  selectedDate={currentDate}
                  onSelectDate={(date) => {
                    setCurrentDate(date);
                    setIsCalendarOpen(false);
                  }}
                />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>

          <button
            onClick={() => setCurrentDate(addDays(currentDate, 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--panel)] transition-all duration-200"
            aria-label="Next day"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Right: Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[var(--text-muted)] font-mono">
            {tasks.done}/{tasks.tasks.length} done
          </span>
          <button
            onClick={() => setRightOpen(!rightOpen)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${
              rightOpen
                ? "bg-[var(--panel)] text-[var(--accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--panel)]"
            }`}
            aria-label={rightOpen ? "Close sidebar" : "Open sidebar"}
          >
            <ChevronRight size={16} className={`transition-transform duration-200 ${rightOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Drawer */}
        <aside
          className={`absolute left-0 top-0 bottom-0 z-20 bg-[var(--panel)] border-r border-[var(--border)] panel-transition overflow-hidden ${
            leftOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
          }`}
          style={{ width: "var(--sidebar-width)" }}
        >
          <LeftPanel
            time={time}
            weather={weather}
            pomodoro={pomodoro}
            tasksDone={tasks.done}
            totalTasks={tasks.tasks.length}
            taskProgress={tasks.taskProgress}
            scratchpad={scratchpad.scratchpad}
            onUpdateScratchpad={scratchpad.updateScratchpad}
          />
        </aside>

        {/* Center Content */}
        <main
          className="flex-1 min-w-0 flex flex-col transition-all duration-300"
          style={{
            marginLeft: leftOpen ? "var(--sidebar-width)" : "0",
            marginRight: rightOpen ? "var(--sidebar-width)" : "0",
          }}
        >
          <CenterPanel
            ref={inputRef}
            tasks={tasks.tasks}
            selectedIdx={tasks.selectedIdx}
            setSelectedIdx={tasks.setSelectedIdx}
            onToggleTask={tasks.toggleTask}
            onDeleteTask={tasks.deleteTask}
            onAddTask={tasks.addTask}
            onEditTask={tasks.editTask}
            onAddSubtask={tasks.addSubtask}
            onToggleSubtask={tasks.toggleSubtask}
            onDeleteSubtask={tasks.deleteSubtask}
            onUpdateTimer={tasks.updateTimer}
          />
        </main>

        {/* Right Drawer */}
        <aside
          className={`absolute right-0 top-0 bottom-0 z-20 bg-[var(--panel)] border-l border-[var(--border)] panel-transition overflow-hidden ${
            rightOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
          }`}
          style={{ width: "var(--sidebar-width)" }}
        >
          <RightPanel
            bookmarks={bookmarks.bookmarks}
            onAddBookmark={bookmarks.addBookmark}
            onAddFolder={bookmarks.addFolder}
            onUpdateBookmark={bookmarks.updateBookmark}
            onDeleteBookmark={bookmarks.deleteBookmark}
            onImportBookmarks={bookmarks.importBookmarks}
            onExportBookmarks={bookmarks.exportBookmarks}
          />
        </aside>
      </div>
    </div>
  );
}

export default App;
