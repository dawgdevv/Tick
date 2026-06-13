# Tick — Markdown Editor & Redesign Complete

## ✅ Build Status: PASSING

```bash
cd /home/nishant-raj/Develop/tick
make build   # ✅ Frontend + Go binary compiled successfully
```

---

## 🆕 What's New

### 1. Inbuilt Markdown Editor (Obsidian-inspired)

The center panel now transforms into a full markdown workspace:

**Features:**
- **Edit / Preview / Split** view toggle
- **File tree sidebar** — recursive folder browser for markdown files
- **Open folder** — pick any directory on your system as a "vault"
- **Auto-save** — dirty indicator + manual save button
- **Live preview** — rendered with `marked` (GitHub-flavored markdown)
- **Clean prose styling** — headings, code blocks, tables, blockquotes, links

**Keyboard Shortcuts:**
| Key | Action |
|-----|--------|
| `t` | Switch to Task Mode |
| `m` | Switch to Markdown Mode |
| `[` | Toggle Left Panel |
| `]` | Toggle Right Panel |

---

### 2. Collapsible Side Panels

Both the Left Panel (context) and Right Panel (quicklinks) can now be **collapsed**:

- **Top bar toggle buttons** — click `PanelLeft` / `PanelRight` icons
- **Keyboard shortcuts** — `[` and `]`
- **Smooth animation** — 300ms width transition
- **Center panel expands** to fill the space

---

### 3. Global Mode Toggle

A new **top bar** appears above the center panel:

```
┌────────────────────────────────────────────────────────────┐
│  [≡]  tasks  ·  notes  │  date/path  │  [≡]            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│              Center Panel (Tasks or Markdown)              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

- **Tasks mode** — original task dock with date navigation, task list, add task
- **Markdown mode** — file tree + editor + preview

---

## 🏗️ Architecture Changes

### New Files

```
Backend:
├── internal/workspace/workspace.go      — File CRUD API (list, read, write)

Frontend:
├── web/src/types/index.ts               — Added FileNode, WorkspaceInfo, FileContent, AppMode, MarkdownView
├── web/src/hooks/
│   ├── useWorkspace.ts                  — Workspace directory + file list management
│   └── useMarkdown.ts                 — Current file, content, dirty state, save
├── web/src/components/markdown/
│   ├── FileTree.tsx                     — Recursive file browser sidebar
│   ├── MarkdownEditor.tsx               — Plain textarea editor
│   ├── MarkdownPreview.tsx              — marked-rendered preview
│   └── MarkdownPanel.tsx                — Full markdown panel (toolbar + editor + preview + file tree)
```

### Modified Files

```
Backend:
├── main.go                              — Added /api/workspace routes

Frontend:
├── web/src/App.tsx                      — Major redesign: mode toggle, collapsible panels, top bar
├── web/src/components/panels/LeftPanel.tsx     — Updated keyboard reference with new shortcuts
├── web/src/index.css                    — Added .prose-custom styles for markdown rendering
└── web/src/types/index.ts               — Extended with markdown types
```

---

## 🎮 How to Use

### Switching Modes

1. **Click the toggle buttons** in the top bar:
   - `tasks` — shows task dock
   - `notes` — shows markdown editor

2. **Or use keyboard shortcuts:**
   - Press `t` for Task Mode
   - Press `m` for Markdown Mode

### Markdown Mode

1. **Open a folder** — Click "open folder" in the file tree, or press the button in the sidebar
2. **Browse files** — Click any `.md` file in the file tree to open it
3. **Edit** — Type in the left pane (split view) or full editor
4. **Preview** — See rendered markdown in the right pane (split view)
5. **Toggle views** — Click the edit/preview/split icons in the toolbar
6. **Save** — Click the save icon (or it will show a dirty indicator `●`)

### Collapsing Panels

1. **Click the panel toggle buttons** in the top bar
2. **Or use keyboard shortcuts:**
   - `[` — toggle left panel
   - `]` — toggle right panel

---

## 🧪 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/workspace` | Get current workspace path |
| `POST` | `/api/workspace` | Set workspace path (`{"path": "/home/user/notes"}`) |
| `GET` | `/api/workspace/files` | List all markdown files recursively |
| `GET` | `/api/workspace/files?path=...` | Read file content |
| `POST` | `/api/workspace/files?path=...` | Write file content (`{"content": "..."}`) |

---

## 🎨 Design Notes

The markdown editor follows the same **industrial/utilitarian** aesthetic:
- OKLCH color tokens (same as the rest of the app)
- Clean typography hierarchy in rendered markdown
- No decorative elements — functional, minimal
- Keyboard-first design
- `prefers-reduced-motion` respected

---

## 🗂️ Complete Project Structure

```
tick/
├── main.go
├── Makefile
├── go.mod / go.sum
├── internal/
│   ├── db/
│   │   └── db.go
│   ├── handlers/
│   │   └── handlers.go
│   ├── workspace/
│   │   └── workspace.go          ← NEW
│   └── webdist/
├── web/
│   ├── src/
│   │   ├── App.tsx               ← REDESIGNED
│   │   ├── main.tsx
│   │   ├── index.css             ← + markdown prose styles
│   │   ├── types/
│   │   │   └── index.ts          ← + markdown types
│   │   ├── hooks/
│   │   │   ├── useClock.ts
│   │   │   ├── useWeather.ts
│   │   │   ├── usePomodoro.ts
│   │   │   ├── useTasks.ts
│   │   │   ├── useQuicklinks.ts
│   │   │   ├── useKeyboardShortcuts.ts
│   │   │   ├── useWorkspace.ts   ← NEW
│   │   │   └── useMarkdown.ts    ← NEW
│   │   ├── components/
│   │   │   ├── panels/
│   │   │   │   ├── LeftPanel.tsx
│   │   │   │   ├── CenterPanel.tsx
│   │   │   │   └── RightPanel.tsx
│   │   │   ├── markdown/         ← NEW
│   │   │   │   ├── FileTree.tsx
│   │   │   │   ├── MarkdownEditor.tsx
│   │   │   │   ├── MarkdownPreview.tsx
│   │   │   │   └── MarkdownPanel.tsx
│   │   │   ├── task/
│   │   │   │   ├── TaskList.tsx
│   │   │   │   ├── TaskItem.tsx
│   │   │   │   └── TaskInput.tsx
│   │   │   ├── quicklink/
│   │   │   │   ├── QuicklinkList.tsx
│   │   │   │   ├── QuicklinkItem.tsx
│   │   │   │   └── AddQuicklinkModal.tsx
│   │   │   └── calendar/
│   │   │       └── Calendar.tsx
│   │   └── lib/
│   │       └── utils.ts
│   └── package.json
└── bin/
    └── tick
```

---

## 🚀 Next Steps

1. **Run the app:**
   ```bash
   cd /home/nishant-raj/Develop/tick
   make run
   ```

2. **Open in browser:** `http://localhost:8080`

3. **Try it out:**
   - Press `m` to switch to markdown mode
   - Click "open folder" and pick a directory with `.md` files
   - Press `t` to go back to tasks
   - Press `[` and `]` to collapse panels
