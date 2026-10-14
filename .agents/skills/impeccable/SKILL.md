---
name: impeccable
description: >-
  Impeccable frontend craft, micro-interactions, haptic feedback, safe-area ergonomics, and pixel perfection.
  Use this skill whenever polishing interactions, touch targets, state transitions, loading/empty states, and precision typography.
---

# Impeccable Frontend Craft Skill

This skill establishes zero-defect standards for touch interfaces, typography alignment, and state responsiveness.

## 1. Touch Ergonomics & Safe Targets
- **44x44 Minimum Touch Targets**: Interactive items must have ample tap surface, padded bounds, and comfortable hit slop.
- **Floating Dock Clearance**: Bottom navigation floating bars require at least `90px` to `100px` content padding at the bottom of scroll views so bottom items are never obscured.
- **Haptic Tactility**: Tactile response on user actions:
  - Light tap for tabs and toggles (`triggerHaptic('light')`).
  - Medium snap for primary action buttons (`triggerHaptic('medium')`).
  - Crisp celebration sequence for completed goals and successful syncs (`triggerHaptic('success')`).

## 2. Dynamic State Completeness
- **Zero Blank States**: Every list or metric container must render an evocative, beautifully formatted empty state or placeholder with informative guidance.
- **Loading Non-Blocking**: Micro-spinners (`ActivityIndicator`) inside buttons rather than jarring full-screen spinners that freeze user interaction.
- **Tabular Alignment**: Multi-column data and byte rates must align on the right edge with monospaced numbers.
