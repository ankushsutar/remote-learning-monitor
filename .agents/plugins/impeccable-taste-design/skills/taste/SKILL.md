---
name: taste
description: >-
  Design taste, aesthetic discernment, spatial elegance, and visual restraint for crafting tier-one user interfaces.
  Use this skill whenever designing layout aesthetics, selecting color harmonies, choosing typography weights, or refining the overall visual feel of an application.
---

# Design Taste Skill

This skill defines the philosophy and execution guidelines for high-taste digital product design (exemplified by Linear, Apple, Raycast, and Opal).

## 1. Aesthetic Philosophy: The Art of Restraint
- **Avoid Over-Decoration**: Resist the urge to add gradients and shadows to every element. True taste is confident simplicity with hyper-clean execution.
- **Single Focal Hierarchy**: Each screen must have one primary visual anchor (e.g. Hero Focus Ring or Stat Metric). Secondary elements must step back into darker, lower-contrast tones.
- **Chromatic Depth**: Avoid flat `#000000`. Use tailored dark hues (`#070A12`, `#090D16`, `#0F172A`) that give OLED screens rich depth and atmospheric presence.

## 2. Typography Rules
- **Proportional Tracking**: Tighter letter spacing on large display headings (`letterSpacing: -0.8`), wider letter spacing on uppercase badges and eyebrows (`letterSpacing: 0.8` to `1.2`).
- **Tabular Figures**: Always format numerals, percentages, and counters with `fontVariant: ['tabular-nums']` to prevent horizontal jitter during updates.
- **Visual Contrast**: Hero text in `#F8FAFC`, secondary in `#94A3B8`, muted labels in `#64748B`. Never use pure gray without subtle slate undertones.

## 3. Micro-Lighting & Edge Borders
- **Subtle 1px Borders**: In dark mode, structure comes from fine border strokes (`rgba(255, 255, 255, 0.08)` or accent glows `rgba(99, 102, 241, 0.25)`).
- **Surface Elevation**: Cards sit on `rgba(15, 23, 42, 0.75)` with deep soft shadows (`shadowOpacity: 0.35`, `shadowRadius: 12`).
