---
name: design-taste
description: >-
  Design taste, aesthetic discernment, and visual excellence guidelines for creating world-class user interfaces.
  Use this skill whenever making UI/UX design choices, styling components, selecting color palettes, balancing visual hierarchy, or elevating frontend aesthetics to a premium, delightful standard.
---

# Design Taste & Aesthetic Judgment Skill

This skill defines the philosophy, principles, and aesthetic standards required to build software that looks and feels like a tier-one product (Linear, Apple, Opal, Raycast, Vercel).

---

## 1. Core Principles of Great Design Taste

### 1.1 Intentional Restraint over Visual Clutter
- Great design is defined by what you leave out. Do not overload screens with competing bright accents.
- Pick **one primary signature accent** (e.g., Electric Indigo `#6366F1` or Vivid Cyan `#06B6D4`) and use it sparingly to draw the eye to primary calls-to-action and active states.
- Support accents (Emerald `#10B981` for success/study, Amber `#F59E0B` for streaks/warnings, Rose `#F43F5E` for distractions/alerts) should only appear when conveying semantic state.

### 1.2 Deep, Multi-Layered Dark Mode (Not Flat Black)
- Pure black (`#000000`) looks harsh and flat on modern OLED and AMOLED displays.
- Instead, use a **tailored chromatic dark palette**:
  - Deep Canvas / Background: `#070A12` or `#090D16` (subtle midnight blue undertone).
  - Surface Level 1 (Cards): `rgba(17, 24, 39, 0.75)` or `#0F172A`.
  - Surface Level 2 (Elevated): `rgba(30, 41, 59, 0.7)` or `#1E293B`.
  - Border Strokes: Ultra-fine, subtle borders `rgba(255, 255, 255, 0.08)` or `rgba(99, 102, 241, 0.18)` create crisp edge definition.

### 1.3 Typography as Architecture
- **Hierarchy is non-negotiable**:
  - Overline / Eyebrow: `fontSize: 10–11`, `fontWeight: '800'`, `letterSpacing: 0.8`, uppercase, muted color (`#64748B` or `#818CF8`).
  - Hero Header: `fontSize: 24–28`, `fontWeight: '800'`, `letterSpacing: -0.6`, high contrast (`#F8FAFC`).
  - Section Title: `fontSize: 16–18`, `fontWeight: '700'`, `letterSpacing: -0.3`.
  - Body: `fontSize: 13–14`, `fontWeight: '400'` or `'500'`, line height 1.4, neutral slate (`#94A3B8`).
  - Tabular Numbers: Use `fontVariant: ['tabular-nums']` for countdown timers, metrics, and byte counters to prevent jitter.

### 1.4 Depth, Glassmorphism & Micro-Lighting
- Cards should have subtle 1px border strokes with `shadowColor: '#000'`, `shadowOpacity: 0.35`, and subtle blur radii.
- Inset pills and badges should use 10–15% opacity fills with matching 100% saturation text (`backgroundColor: 'rgba(16, 185, 129, 0.12)'`, `color: '#10B981'`).

### 1.5 Purposeful Motion & Haptic Tactility
- Every tap target must offer immediate tactile confirmation (`triggerHaptic('light')`).
- Buttons should have subtle scale dips on press (`activeOpacity: 0.75`–`0.85`).
- Status changes (like sync completions or streak increments) should be celebrated with crisp haptic patterns (`triggerHaptic('success')`).
