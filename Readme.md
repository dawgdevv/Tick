# Tick

> Terminal-launched daily planning dock for developers

## Overview

Tick is a local-first, privacy-focused daily planning dock built specifically for developers. It runs as a single Go binary, uses SQLite for persistent storage, and serves a minimal dark-mode web interface embedded via `go:embed`.

Designed to be fast, distraction-free, and fully usable without cloud services. Tick emphasizes structured daily execution, simplicity, and developer-grade ergonomics over bloated productivity features or unnecessary complexity.

## Features

- **Keyboard-first interaction** — Navigate and manage tasks entirely from the keyboard
- **Local-first** — No cloud dependencies, no account required, complete privacy
- **Single binary** — Self-contained Go executable, easy to deploy
- **SQLite storage** — Reliable, portable persistent data
- **Dark-mode UI** — Minimal, eye-friendly interface
- **Pomodoro Focus Timer** — Built-in 25/5 work/break timer with session tracking
- **Three-column layout:**
  - **Context Panel** — Clock, weather, focus timer, and task progress
  - **Task Dock** — Central daily task management
  - **Quicklinks** — Frequently used resources
- **Linux System Tray Extension** — Panel indicator for quick task access
- **Auto-start on Login** — Runs automatically via systemd

## Tech Stack

- **Go** — Single binary compilation
- **SQLite** — Persistent storage
- **go:embed** — Embedded web interface
- **Python 3 + GTK3** — Linux tray extension
- **systemd** — Service management for autostart

---

## Installation

### Global Install (Go)

Users can install Tick directly from GitHub:

```bash
go install github.com/dawgdevv/tick@latest
tick
```

> Make sure `$GOBIN` (or `$GOPATH/bin`) is in your `PATH`.

### From Binary

Download the latest release for your platform from the releases page, extract, and run:

```bash
./tick
```

### From Source

Requirements:
- Go 1.25+
- Node.js 20+ and npm

```bash
git clone https://github.com/dawgdevv/tick.git
cd tick
make deps       # install frontend dependencies (first time only)
make build      # build frontend + Go binary
./bin/tick
```

The `make build` command is the global project build command. It compiles the frontend (`web/dist`) and then builds the Go binary (`bin/tick`).

### Build Commands

```bash
make help       # List available commands
make deps       # Install frontend dependencies
make web-build  # Build frontend assets
make build      # Build frontend + backend binary
make run        # Build and run
make clean      # Clean build outputs
```

---

## Usage

Launch Tick from your terminal:

```bash
./tick
```

By default, Tick serves on `http://localhost:8080`. Open this URL in your browser to access the interface.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `n` | New task |
| `j/k` or `↓/↑` | Navigate tasks |
| `x` | Toggle task complete |
| `d` | Delete task |
| `Enter` | Edit task |
| `Escape` | Cancel / Close |

---

## Linux Desktop Integration

Tick ships with two optional Linux desktop integrations that work together:

1. **Auto-start Service** — A systemd user service that runs the Tick server in the background whenever you log in
2. **System Tray Extension** — A GTK3 panel indicator that sits in your GNOME top bar, giving you instant access to tasks without opening a browser

### Prerequisites

| Requirement | Minimum Version | Check Command |
|-------------|----------------|---------------|
| **Linux Desktop** | GNOME 40+ (Ubuntu 22.04+, Fedora 36+, etc.) | `gnome-shell --version` |
| **Python 3** | 3.10+ | `python3 --version` |
| **GTK3 GIR bindings** | — | `python3 -c "import gi; gi.require_version('Gtk','3.0')"` |
| **AppIndicator3 GIR** | — | `python3 -c "import gi; gi.require_version('AyatanaAppIndicator3','0.1')"` |
| **Pillow** (for icon) | — | `pip3 show pillow` |
| **systemd** | — | `systemctl --version` |

#### Installing Prerequisites

**Ubuntu/Debian:**

```bash
sudo apt install python3 python3-gi gir1.2-ayatanaappindicator3-0.1 python3-pil
```

**Fedora:**

```bash
sudo dnf install python3 python3-gobject libayatana-appindicator-gtk3 python3-pillow
```

**Arch Linux:**

```bash
sudo pacman -S python python-gobject libayatana-appindicator python-pillow
```

> **Note:** GNOME Shell requires an AppIndicator extension to show tray icons. If tray icons don't appear, install the [AppIndicator Support](https://extensions.gnome.org/extension/615/appindicator-support/) GNOME extension.

---

### Step 1: Build Tick

Make sure you have a working Tick binary before setting up the integrations:

```bash
cd /path/to/tick
make deps      # first time only
make build
```

Verify the binary works:

```bash
./bin/tick &
curl -s http://localhost:8080/api/tasks
# Should return JSON (e.g., null or [])
kill %1
```

---

### Step 2: Generate the Tray Icon

The tray extension needs a small PNG icon. Generate it from the existing favicon:

```bash
python3 -c "
from PIL import Image, ImageDraw
img = Image.new('RGBA', (22, 22), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)
s = 22/32
points = [(6.5*s, 16.5*s), (13*s, 23*s), (25.5*s, 9*s)]
draw.line(points, fill=(74, 222, 128, 255), width=2)
img.save('tick-icon.png')
print('✓ tick-icon.png created')
"
```

This creates a 22×22 transparent PNG with a green checkmark matching Tick's accent color.

---

### Step 3: Set Up Auto-start (systemd)

Create a systemd user service so the Tick server starts automatically on login.

**1. Create the service file:**

```bash
mkdir -p ~/.config/systemd/user

cat > ~/.config/systemd/user/tick.service << 'EOF'
[Unit]
Description=Tick - Daily Planning Dock
After=network.target

[Service]
Type=simple
ExecStart=/absolute/path/to/tick/bin/tick
WorkingDirectory=/absolute/path/to/tick
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target
EOF
```

> **⚠ Important:** Replace `/absolute/path/to/tick` with the actual absolute path to your Tick project directory (e.g., `/home/youruser/tick`).

**2. Enable and start the service:**

```bash
systemctl --user daemon-reload
systemctl --user enable tick.service    # auto-start on login
systemctl --user start tick.service     # start right now
```

**3. Verify it's running:**

```bash
systemctl --user status tick.service
```

You should see `Active: active (running)`. The Tick dashboard is now accessible at `http://localhost:8080`.

#### Service Management Commands

| Command | Action |
|---------|--------|
| `systemctl --user status tick.service` | Check if running |
| `systemctl --user start tick.service` | Start the server |
| `systemctl --user stop tick.service` | Stop the server |
| `systemctl --user restart tick.service` | Restart (e.g. after rebuild) |
| `systemctl --user disable tick.service` | Disable auto-start |
| `journalctl --user -u tick.service -f` | View live logs |

> **Tip:** After running `make build` to update the binary, restart the service with `systemctl --user restart tick.service`.

---

### Step 4: Set Up the System Tray Extension

The tray extension is a Python GTK3 app (`tick-tray.py`) that runs alongside the Tick server.

**1. Verify the tray script exists:**

The file `tick-tray.py` should be in the root of your Tick project directory. If not, you can find it in the repository.

**2. Make it executable:**

```bash
chmod +x /path/to/tick/tick-tray.py
```

**3. Test it manually:**

```bash
python3 /path/to/tick/tick-tray.py &
```

A green checkmark (✓) icon should appear in your GNOME top bar. Click it to see the menu.

**4. Set up autostart:**

```bash
mkdir -p ~/.config/autostart

cat > ~/.config/autostart/tick-tray.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=Tick Tray
Exec=/usr/bin/python3 /absolute/path/to/tick/tick-tray.py
Hidden=false
X-GNOME-Autostart-enabled=true
Comment=Tick task manager tray indicator
Icon=/absolute/path/to/tick/tick-icon.png
EOF
```

> **⚠ Important:** Replace `/absolute/path/to/tick` with the actual absolute path to your Tick project directory.

---

### Tray Extension Features

When you click the ✓ icon in the top bar and select **"Show Tick"**, a popup appears with:

| Feature | Description |
|---------|-------------|
| **Task List** | View today's pending and completed tasks |
| **Toggle Tasks** | Click the checkbox to mark tasks done/undone |
| **Add Task** | Type a new task and press Enter or click `+` |
| **Focus Timer** | 25-minute work / 5-minute break Pomodoro timer |
| **Quicklinks** | Clickable list of your saved links |
| **Progress Bar** | Visual indicator of task completion |
| **Open Dashboard** | One-click to open the full web interface |

The popup auto-refreshes every 30 seconds and updates immediately when you add or toggle tasks.

---

### Troubleshooting

#### Tray icon doesn't appear

1. **Install the AppIndicator GNOME extension:**
   ```bash
   # Ubuntu
   sudo apt install gnome-shell-extension-appindicator
   ```
   Then log out and log back in, or restart GNOME Shell (`Alt+F2` → `r` → Enter).

2. **Check if the GNOME extension is enabled:**
   ```bash
   gnome-extensions list | grep appindicator
   ```

#### "Address already in use" error when running `make run`

The systemd service is already running Tick on port 8080. Either:
- Stop the service first: `systemctl --user stop tick.service`
- Or just use the service (recommended) — Tick is already running!

#### Tray says "Server not reachable"

The Tick server might not be running yet. Check and start it:

```bash
systemctl --user status tick.service
systemctl --user start tick.service
```

Then click **Refresh** in the tray menu.

#### Python import errors

Install the missing dependencies:

```bash
# Ubuntu/Debian
sudo apt install python3-gi gir1.2-ayatanaappindicator3-0.1

# Fedora
sudo dnf install python3-gobject libayatana-appindicator-gtk3
```

#### Changes not reflected after rebuild

After running `make build`, restart the systemd service to pick up the new binary:

```bash
systemctl --user restart tick.service
```

---

### Uninstalling Desktop Integration

To remove the autostart and tray extension:

```bash
# Stop and disable the systemd service
systemctl --user stop tick.service
systemctl --user disable tick.service
rm ~/.config/systemd/user/tick.service
systemctl --user daemon-reload

# Remove tray autostart
rm ~/.config/autostart/tick-tray.desktop

# Kill any running tray process
pkill -f "tick-tray.py"
```

---

## Project Structure

```
tick/
├── main.go                 # Entry point — HTTP server, routing, embedded assets
├── Makefile                # Build commands
├── go.mod / go.sum         # Go module
├── tick.db                 # SQLite database (created at runtime)
├── tick-tray.py            # Linux tray extension (Python/GTK3)
├── tick-icon.png           # Tray icon (22×22 PNG)
├── internal/
│   ├── db/                 # Database layer (SQLite)
│   ├── handlers/           # HTTP API handlers (tasks, quicklinks)
│   └── webdist/            # Compiled frontend (embedded via go:embed)
├── web/                    # Frontend source (Vite + React + TypeScript)
│   ├── src/
│   │   ├── App.tsx         # Main application component
│   │   ├── index.css       # Global styles and design tokens
│   │   └── components/     # UI components (Calendar)
│   └── package.json
└── bin/
    └── tick                # Compiled Go binary
```

---

## API Reference

Tick exposes a simple REST API on `http://localhost:8080`:

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks?date=YYYY-MM-DD` | Get tasks for a date (defaults to today) |
| `POST` | `/api/tasks` | Create a task (`{"title": "...", "date": "YYYY-MM-DD"}`) |
| `PATCH` | `/api/tasks?id=N` | Toggle task completion |
| `DELETE` | `/api/tasks?id=N` | Delete a task |

### Quicklinks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/quicklinks` | Get all quicklinks |
| `POST` | `/api/quicklinks` | Create a link (`{"name": "...", "url": "..."}`) |
| `DELETE` | `/api/quicklinks?id=N` | Delete a quicklink |

### Time

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/time` | Get current server time and date |

---

## Philosophy

Tick is built on these core principles:

1. **Speed** — Sub-second startup, instant interactions
2. **Simplicity** — Only essential features, no bloat
3. **Privacy** — Your data stays on your machine
4. **Developer ergonomics** — Keyboard-first, terminal-friendly

## License

MIT — see [LICENSE](LICENSE)
