---
name: ui-ux-design
description: >-
  UI/UX design principles: information architecture, visual hierarchy, dark glassmorphism, micro-animations, and intuitive touch interaction design.
  Use this skill whenever designing mobile screens, dashboards, modals, navigation bars, or data visualization widgets.
---

# UI/UX Design System Skill

This skill defines the visual language, design system tokens, and UX patterns for Aegis.

## 1. Unified Design Tokens
```typescript
export const ThemeTokens = {
  colors: {
    bg: '#070A12',
    surface: 'rgba(15, 23, 42, 0.82)',
    surfaceElevated: 'rgba(30, 41, 59, 0.75)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderAccent: 'rgba(99, 102, 241, 0.3)',
    primary: '#6366F1',
    primaryLight: '#818CF8',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    textHero: '#F8FAFC',
    textBody: '#94A3B8',
    textMuted: '#64748B'
  },
  radii: {
    sm: 8,
    md: 14,
    lg: 18,
    full: 999
  }
};
```

## 2. Component Design Standards
- **Floating Bottom Capsule Dock**: Floating pill bottom bar with subtle dark blur, rounded-full corners, and glowing active indicators.
- **Glass Cards**: Translucent dark surfaces with 1px fine borders and drop shadows (`shadowOpacity: 0.35`, `shadowRadius: 10`).
- **Pulsing Status Dots**: 8px round indicators with colored glow shadows indicating real-time background operation.
