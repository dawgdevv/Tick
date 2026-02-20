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
- **Three-column layout:**
  - **Context Panel** — Current date and time
  - **Task Dock** — Central daily task management
  - **Quicklinks** — Frequently used resources

## Tech Stack

- **Go** — Single binary compilation
- **SQLite** — Persistent storage
- **go:embed** — Embedded web interface

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
git clone <your-repo-url>
cd tick
make build
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

## Screenshots

*Coming soon — screenshots showing the three-column interface*

## Philosophy

Tick is built on these core principles:

1. **Speed** — Sub-second startup, instant interactions
2. **Simplicity** — Only essential features, no bloat
3. **Privacy** — Your data stays on your machine
4. **Developer ergonomics** — Keyboard-first, terminal-friendly

## License

MIT — see [LICENSE](LICENSE)
