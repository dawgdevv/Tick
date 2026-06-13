# Tick Frontend Architecture Audit

## Current State (Before Refactor)

### File Structure
```
web/src/
├── App.tsx          (820 lines) - GOD COMPONENT
├── App.css          (1 line) - Empty, unused
├── main.tsx         (10 lines) - Entry point
├── index.css        (127 lines) - Global styles
├── components/
│   └── Calendar.tsx (104 lines) - Date picker
└── lib/
    └── utils.ts     (6 lines) - cn() utility
```

### App.tsx Breakdown (820 lines)

#### State Management
| State | Lines | Description |
|-------|-------|-------------|
| `currentDate` | 68 | Selected calendar date |
| `isCalendarOpen` | 69 | Calendar popover state |
| `tasks` | 70 | Task list array |
| `quicklinks` | 71 | Quicklinks array |
| `newTask` | 72 | Input buffer for new task |
| `time` | 73 | Current clock time |
| `selectedIdx` | 74 | Keyboard-selected task index |
| `qlOpen` | 75 | Quicklink modal open state |
| `qlName` | 76 | Quicklink form: name |
| `qlUrl` | 77 | Quicklink form: URL |
| `weather` | 80-88 | Weather object |
| `pomMode` | 91 | Pomodoro mode (work/break) |
| `pomTime` | 92 | Pomodoro timer countdown |
| `pomRunning` | 93 | Is timer running? |
| `pomSessions` | 94-103 | Session count (localStorage) |

#### Logic & Effects (lines 108-346)
| Concern | Lines | Lines Count |
|---------|-------|-------------|
| Clock tick | 108-112 | 5 |
| Weather fetching | 114-150 | 37 |
| Pomodoro timer | 152-186 | 35 |
| Task CRUD | 196-271 | 76 |
| Quicklink CRUD | 273-295 | 23 |
| Keyboard shortcuts | 297-346 | 50 |

#### Render JSX (lines 352-817)
| Panel | Lines | Lines Count |
|-------|-------|-------------|
| Left Panel (Clock, Weather, Pomodoro, Progress, Keyboard) | 359-531 | 173 |
| Center Panel (Date Nav, Task List, Add Task) | 536-682 | 147 |
| Right Panel (Quicklinks) | 687-815 | 129 |

## Problems Identified

### 1. **God Component Anti-Pattern** (P0)
- 820 lines in one file
- 12+ pieces of state
- 7+ useEffect hooks
- 6+ API handlers
- All UI panels in one JSX return

### 2. **No Separation of Concerns** (P0)
- Business logic mixed with presentation
- API calls mixed with component state
- Weather logic mixed with task logic
- Keyboard shortcuts mixed with everything

### 3. **Tight Coupling** (P1)
- All panels depend on shared state
- Hard to extract or test individual panels
- No clear data flow

### 4. **No Reusability** (P1)
- Task list UI not reusable
- Quicklink UI not reusable
- Weather logic not reusable

### 5. **Missing Types** (P1)
- Types defined inline in App.tsx
- Not exported for reuse

### 6. **Dead File** (P2)
- `App.css` is empty (1 line)

## Proposed New Structure

```
web/src/
├── App.tsx                              (Clean orchestrator, ~40 lines)
├── main.tsx                             (Entry point)
├── index.css                            (Global styles)
├── types/
│   └── index.ts                         (All shared interfaces)
├── hooks/
│   ├── useClock.ts                      (Time + date formatting)
│   ├── useWeather.ts                    (Geolocation + weather API)
│   ├── usePomodoro.ts                   (Timer + session tracking)
│   ├── useTasks.ts                      (Task CRUD API)
│   ├── useQuicklinks.ts                 (Quicklink CRUD API)
│   └── useKeyboardShortcuts.ts          (Keyboard event handlers)
├── components/
│   ├── panels/
│   │   ├── LeftPanel.tsx                (Context: clock, weather, pomodoro, progress)
│   │   ├── CenterPanel.tsx              (Task dock: date nav, tasks, input)
│   │   └── RightPanel.tsx               (Quicklinks panel)
│   ├── task/
│   │   ├── TaskList.tsx                 (Task list container)
│   │   ├── TaskItem.tsx                 (Single task row)
│   │   └── TaskInput.tsx                (Add task form)
│   ├── quicklink/
│   │   ├── QuicklinkList.tsx            (Quicklink list container)
│   │   ├── QuicklinkItem.tsx            (Single quicklink row)
│   │   └── AddQuicklinkModal.tsx        (Add quicklink dialog)
│   └── calendar/
│       └── Calendar.tsx                 (Existing date picker)
└── lib/
    └── utils.ts                         (cn() utility)
```

## Expected Outcomes

| File | Before | After | Reduction |
|------|--------|-------|-----------|
| App.tsx | 820 lines | ~40 lines | 95% |
| Max file size | 820 lines | ~150 lines | 82% |
| Total files | 6 | 18 | +12 (more granular) |
| Testability | ❌ None | ✅ Hooks isolated | N/A |
| Reusability | ❌ None | ✅ Components modular | N/A |
