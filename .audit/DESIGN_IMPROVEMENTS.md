# Design Audit & Improvements — Applied 2026-06-13

## Design Philosophy

**Direction**: Refined industrial/utilitarian — a precision instrument, not a generic "dark dev tool."

The interface is designed to feel like a personal dashboard that gets out of the way. Every pixel is intentional. No lazy signifiers (monospace everywhere, glowing accents). No generic AI slop.

---

## Changes Applied

### 1. Color System — OKLCH Perceptual Uniformity

**Before:** Raw hex values (`#060608`, `#4ade80`, `#dddde3`)
**After:** OKLCH color space for consistent perceived lightness

```css
:root {
  --bg: oklch(12% 0.02 280);      /* near-black, subtle cool tint */
  --panel: oklch(15% 0.02 280);
  --accent: oklch(72% 0.18 145);  /* green, perceptually balanced */
  --text: oklch(88% 0.02 280);
  /* ... */
}
```

**Why:** OKLCH ensures the same lightness value (e.g., `50%`) feels equally bright across all hues. This prevents the old accent color from appearing "too loud" compared to the neutrals.

### 2. Typography — Disciplined, Not Decorative

**Before:** `"Outfit"` for everything + `font-mono` everywhere as lazy "dev" shorthand
**After:** Refined sans-serif stack + `font-mono` reserved only for:
- Clock time (`tabular-nums` prevents layout shift when seconds tick)
- Keyboard shortcuts
- Date labels
- Numbers in lists

**Added:**
- `font-variant-numeric: tabular-nums` on all numeric displays
- `text-wrap: balance` utility class available
- Ellipsis `…` instead of three dots `...`

### 3. Spacing — Visual Rhythm

**Before:** Identical padding everywhere (`px-5 py-4` repeated), no breathing room
**After:** Varied spacing that creates hierarchy:

| Section | Before | After |
|---------|--------|-------|
| Clock top padding | `pt-7` | `pt-8` — more prominence |
| Clock bottom padding | `pb-4` | `pb-6` — creates air before weather |
| Task list vertical padding | `py-5` | `py-6` — breathing room |
| Divider between sections | `mx-5 border-t` | kept but with more adjacent spacing |

### 4. Layout — Structural Improvements

**Left Panel:**
- Clock seconds now inline with the main time (flex row, not stacked below) — prevents layout shift
- Removed the `boxShadow` on panels (felt decorative, not structural)
- Borders are now the only panel separation — cleaner, more utilitarian

**Center Panel:**
- `min-w-0` preserved for flex truncation
- Task list uses `divide-y` instead of `space-y-px` for cleaner structural separation

**Right Panel:**
- Same shadow removal as left panel
- Cleaner border-only separation

### 5. Accessibility — Web Interface Guidelines

| Rule | Fix |
|------|-----|
| `color-scheme: dark` on `<html>` | ✅ Added |
| `aria-hidden="true"` on decorative icons | ✅ Added to all `<Plus>`, `<Check>`, `<Trash2>`, `<X>` icons |
| `aria-label` on icon buttons | ✅ Already present, improved specificity |
| `transition: all` → explicit properties | ✅ Fixed in 20+ locations |
| `onClick` on `<div>` → `<button>` | ✅ TaskItem now uses `<button>` |
| `outline-none` without replacement | ✅ Inputs now use border-color focus + `focus-visible` ring |
| `prefers-reduced-motion` | ✅ `@media (prefers-reduced-motion: reduce)` added to animations |
| `tabular-nums` for numbers | ✅ Added to `.font-mono` class |
| Labels on form inputs | ✅ Added `htmlFor` on modal inputs |
| `autoComplete` / `spellCheck` on inputs | ✅ Added to all text inputs |

### 6. Interactions — Purposeful Motion

**Before:** `transition-all` on every element (50+ instances)
**After:** Explicit transition properties:

```css
/* Correct: only what changes */
transition: colors 150ms;
transition: opacity 150ms;
transition: border-color 150ms, background-color 150ms;
transition: width 1000ms ease-linear;
```

**Why:** `transition: all` forces the browser to watch every animatable property, causing performance overhead. Listing only the properties that actually change is more performant and intentional.

### 7. Focus States — Visible & Accessible

**Before:** `outline: 2px solid var(--accent)` on everything
**After:** Same approach but with `border-radius: 4px` on the outline, and `focus-visible` on links too. Added `tap-highlight-color: transparent` for mobile.

### 8. Selection — Subtle Cohesion

Added `::selection` styling:
```css
::selection {
  background: var(--accent-bg);
  color: var(--text);
}
```

---

## Anti-Patterns Removed

| Anti-Pattern | Count | Status |
|--------------|-------|--------|
| `transition: all` | 20+ | ✅ Removed |
| `font-mono` as lazy shorthand | 15+ | ✅ Reduced to data-only contexts |
| `boxShadow` on panel edges | 2 | ✅ Removed |
| `onClick` on `<div>` | 1 | ✅ Changed to `<button>` |
| `outline-none` without replacement | 2 | ✅ Fixed with border focus + ring |
| Decorative icons without `aria-hidden` | 10+ | ✅ Added |

---

## Files Modified

```
web/src/
├── index.css              — Complete rewrite: OKLCH, prefers-reduced-motion, tabular-nums
├── components/panels/
│   ├── LeftPanel.tsx      — Typography, spacing, transitions, aria-hidden
│   ├── CenterPanel.tsx    — Transitions, spacing
│   └── RightPanel.tsx     — Transitions, shadow removal
├── components/task/
│   ├── TaskItem.tsx       — div→button, aria-hidden, transitions
│   ├── TaskList.tsx       — divide-y instead of space-y-px
│   └── TaskInput.tsx      — autoComplete, spellCheck, transitions
├── components/quicklink/
│   ├── QuicklinkItem.tsx  — aria-hidden, transitions
│   ├── QuicklinkList.tsx  — Empty state improvement
│   └── AddQuicklinkModal.tsx — Labels, autoComplete, transitions
└── components/Calendar.tsx  — Transitions, spacing
```

---

## Build Verification

```
✓ tsc passes
✓ vite build succeeds
✓ dist/ generated cleanly
```

---

## What's Next (Optional)

- **Fluid typography**: Use `clamp()` for font sizes
- **Container queries**: For panel responsiveness
- **Custom font loading**: Add `font-display: swap` if loading web fonts
- **URL state sync**: Sync date and task selection to query params
- **Virtualization**: For task lists >50 items
