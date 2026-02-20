I’ll answer as a world-class UI prompt engineer who specializes in converting rough wireframes into precise, production-grade design prompts for LLM-powered UI generators.

Below is a **clean, structured design prompt** based exactly on your sketch.
You can paste this directly into any UI-generating LLM or design tool.

---

## 🎯 UI DESIGN PROMPT — Project “Tick”

Design a **dark-mode, developer-focused daily planning dashboard** named **Tick**.

The interface should follow a **three-column layout** with a clean, minimal, professional aesthetic. The UI must feel structured, calm, and tool-like — not playful or SaaS-marketing styled.

---

## 🧱 Overall Layout

Create a full-height desktop web application with **three vertical panels**:

```
| Left Context Panel | Center Task Panel | Right Quicklinks Panel |
```

* Full viewport height
* No page-level scroll
* Each panel scrolls independently
* Subtle borders between panels
* Dark theme only

---

## 🎨 Visual Style

Theme: Dark minimal developer tool

* Background: deep navy/charcoal (#0f172a style)
* Panels: slightly lighter shade
* Subtle 1px borders
* Accent color: soft green or blue
* Clean typography (Inter or modern sans-serif)
* No gradients
* No heavy shadows
* Subtle hover states only

---

## 🟢 Left Panel — Context Panel

Narrow vertical panel on the left.

Contains stacked informational blocks:

* Live time display
* Current date
* Weather
* A large empty card-style area below (for future stats or insights)

Design rules:

* Non-scrollable
* Minimal interaction
* Vertical layout
* Calm appearance

---

## 🔵 Center Panel — Main Task Area

This is the largest section and primary interaction area.

### Top Navigation Bar

At the top of the center panel, include:

* Left arrow button (go to previous date)
* Centered date display (e.g., “Date - 19/2/2026”)
* Dropdown icon next to date (opens calendar)
* Right arrow button (go to next date)

The date navigation must feel like switching daily views.

---

### Task List Area

Below the date bar:

A vertical list of tasks structured like:

```
task 1 ---- [ ]
task 2 ---- [ ]
task 3 ---- [ ]
```

Each task row includes:

* Task title on left
* Checkbox on right
* Clean spacing
* Subtle divider between rows

The task area should be scrollable.

---

### Add Task Area

At the bottom of the task list:

A “type more task +” input section that allows adding new tasks.

Include:

* Inline text input
* Small “+” button
* Clean minimal styling

---

### Task Editor Scroll Indicator

On the right side of the center panel, show a thin vertical scrollbar indicating task editor scroll area.

---

## 🟣 Right Panel — Quicklinks / Bookmark Panel

Narrow vertical panel on the right.

At the top:

```
+ quicklinks/bookmark
```

This acts as a button to open a modal to add a new link (name + URL).

Below it:

A vertical list of bookmarks:

```
1. bookmark
2. bookmark
3. bookmark
4. bookmark
```

This panel should:

* Be scrollable
* Have a visible thin scrollbar
* Use minimal list styling
* Have hover highlight for each bookmark

---

## 📦 Modal Design (Add Link)

When clicking “+ quicklinks/bookmark”:

Open a centered modal with:

* Input for link name
* Input for URL
* Save button
* Cancel button

Modal style:

* Dark background
* Clean border
* Minimal animation
* No blur-heavy effects

---

## ⚙ Interaction Expectations

* Left/right arrows change dates
* Clicking date opens calendar dropdown
* Tasks can be toggled via checkbox
* Task area scrolls independently
* Quicklinks panel scrolls independently
* Add task input expands on focus
* Add bookmark opens modal

---

## 🧠 UX Tone

The interface must feel like:

* A personal developer dashboard
* A daily execution console
* Minimal but powerful
* Structured and calm
* Not decorative
* Not colorful
* Not crowded

---

## 🧩 Technical Intent

This UI is for a:

* Local-first Go backend
* SQLite storage
* Frontend embedded via go:embed
* Desktop-first layout (minimum width 1100px)

---

## 🔚 Summary

Build a three-panel, dark-mode, minimal daily planning dashboard with:

* Date navigation
* Scrollable task list
* Inline task creation
* Right-side bookmark panel
* Modal for adding links
* Clean, professional dev-tool aesthetic

---

If you want, I can now:

* Convert this into a Tailwind-specific prompt
* Convert it into a React component spec
* Convert it into pure HTML/CSS structure
* Or write production-ready starter UI code

