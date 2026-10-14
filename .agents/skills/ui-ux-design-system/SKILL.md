---
name: ui-ux-design-system
description: >-
  Design system tokens, typography scales, glassmorphism card blueprints, and UI component standards.
  Use this skill whenever creating new UI components, establishing design tokens, standardizing colors, or implementing cohesive UI/UX themes across mobile and web.
---

# UI/UX Design System Specification

This skill documents the design tokens, component architecture, and styling rules for the Aegis platform.

---

## 1. Color Palette Tokens

```typescript
export const ThemeTokens = {
  colors: {
    // Canvas & Surfaces
    background: '#070A12',
    cardBackground: 'rgba(15, 23, 42, 0.75)',
    cardElevated: 'rgba(30, 41, 59, 0.7)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    cardBorderHover: 'rgba(99, 102, 241, 0.35)',

    // Primary Accents
    primary: '#6366F1',        // Electric Indigo
    primaryLight: '#818CF8',
    primaryGlow: 'rgba(99, 102, 241, 0.25)',

    // Semantics
    success: '#10B981',        // Emerald Focus
    successGlow: 'rgba(16, 185, 129, 0.2)',
    warning: '#F59E0B',        // Amber Streak / Alert
    warningGlow: 'rgba(245, 158, 11, 0.2)',
    danger: '#EF4444',         // Crimson Tamper
    dangerGlow: 'rgba(239, 68, 68, 0.2)',

    // Text & Muted
    textHero: '#F8FAFC',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textDisabled: '#475569'
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    pill: 9999
  }
};
```

---

## 2. Card Architecture Blueprint

Every card in the mobile application should adhere to the **Glass Surface Paradigm**:

```typescript
const cardStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.78)',
  borderColor: 'rgba(255, 255, 255, 0.08)',
  borderWidth: 1,
  borderRadius: 18,
  padding: 16,
  marginBottom: 14,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.35,
  shadowRadius: 12,
  elevation: 6
};
```

---

## 3. Micro-Badges & Status Dots

```typescript
// Active green status dot with pulsing glow
const statusDot = {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: '#10B981',
  shadowColor: '#10B981',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.8,
  shadowRadius: 6,
  elevation: 4
};
```
