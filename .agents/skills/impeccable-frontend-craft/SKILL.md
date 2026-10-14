---
name: impeccable-frontend-craft
description: >-
  Standards for impeccable frontend engineering, touch ergonomics, micro-interactions, and flawless UI execution.
  Use this skill whenever refining UI components, handling loading/empty states, polishing touch targets, preventing layout shifts, or implementing high-polish frontend code.
---

# Impeccable Frontend Craft Skill

This skill outlines the technical execution rules required to deliver flawless, bug-free, and delightfully ergonomic user interfaces.

---

## 1. Ergonomics & Touch Mechanics

### 1.1 Minimum Touch Targets (44 × 44 pt)
- Never create tappable buttons smaller than 44 × 44 points.
- If an icon is visually small (e.g. a 16px close cross `✕`), expand its hit area with `hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}` or wrap it in a padded `TouchableOpacity`.

### 1.2 Instant Visual & Haptic Feedback
- Touch elements must immediately react to user input:
  - `activeOpacity: 0.7` for pill buttons.
  - Call `triggerHaptic('light')` on navigation and toggle presses.
  - Call `triggerHaptic('success')` on completed actions (sync, pairing, Pomodoro finish).
  - Call `triggerHaptic('error')` on rejections or invalid inputs.

### 1.3 Floating Dock & Safe Area Harmony
- Floating bottom tab bars must reserve sufficient padding at the bottom (`paddingBottom: 28`–`34`) to clear Android gesture navigation pills and iOS home indicators.
- Scroll views behind floating bars must include bottom content padding (`contentContainerStyle={{ paddingBottom: 100 }}`) so the last card is never hidden beneath the floating bar.

---

## 2. Formatting & Numerical Precision

### 2.1 Tabular Numbers (No Jitter)
- For counters, timers, clock displays, and bandwidth values, always declare:
  ```typescript
  fontVariant: ['tabular-nums']
  ```
  This ensures numbers take identical width, preventing annoying horizontal text bouncing when numbers change.

### 2.2 Smooth Metric Formatting
- **Bandwidth**:
  - `< 1 KB`: `${bytes} B`
  - `< 1 MB`: `${(bytes / 1024).toFixed(1)} KB`
  - `≥ 1 MB`: `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  - `≥ 1 GB`: `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
- **Durations**:
  - `< 60s`: `${sec}s`
  - `< 60m`: `${Math.floor(sec / 60)}m ${sec % 60 > 0 ? (sec % 60) + 's' : ''}`
  - `≥ 60m`: `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`

---

## 3. Empty States, Badges & Loading States

### 3.1 Engaging Empty States
- Never show an empty white/black void.
- Always provide an illustrative visual badge (icon/emoji), a reassuring headline, and a clear call-to-action button (e.g., *"Take 15m Snapshot"*).

### 3.2 Category Palette Tokens
Consistently use curated color tokens across both mobile and web:
- **Educational** (`#10B981` Emerald)
- **Productive** (`#3B82F6` Sky Blue)
- **Social Media** (`#EC4899` Rose/Pink)
- **Gaming** (`#F59E0B` Amber/Orange)
- **Entertainment** (`#EF4444` Crimson Red)
- **System / Unclassified** (`#64748B` Slate)
