import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  className?: string;
}

export function Calendar({ selectedDate, onSelectDate, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className={cn("p-4 w-[280px]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg hover:bg-[var(--panel-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-150 cursor-pointer"
          type="button"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="font-mono text-sm font-medium text-[var(--text)] select-none">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <button
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg hover:bg-[var(--panel-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-150 cursor-pointer"
          type="button"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-mono text-[var(--text-muted)] select-none uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1 gap-x-1 place-items-center">
        {calendarDays.map((dayItem) => {
          const isSelected = isSameDay(dayItem, selectedDate);
          const isCurrentMonth = isSameMonth(dayItem, currentMonth);
          const isDayToday = isToday(dayItem);

          return (
            <button
              key={dayItem.toISOString()}
              onClick={() => onSelectDate(dayItem)}
              className={cn(
                "h-8 w-8 flex items-center justify-center rounded-lg text-xs font-mono relative cursor-pointer transition-all duration-200",
                !isCurrentMonth && "text-[var(--text-faint)] opacity-40 hover:opacity-100",
                isCurrentMonth && !isSelected && !isDayToday && "text-[var(--text-secondary)] hover:bg-[var(--panel-hover)] hover:text-[var(--text)]",
                isSelected && "bg-[var(--accent)] text-[var(--bg)] font-bold shadow-lg shadow-[var(--accent-glow)] hover:bg-[var(--accent)]",
                !isSelected && isDayToday && "text-[var(--accent)] font-medium border border-[var(--accent-border)] bg-[var(--accent-bg)]"
              )}
              type="button"
            >
              {format(dayItem, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
