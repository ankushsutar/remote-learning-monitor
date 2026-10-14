---
name: frontend-skills
description: >-
  Advanced React Native and modern frontend engineering best practices: performance optimization, memoization, resilient state pipelines, and responsive layout architecture.
  Use this skill whenever structuring frontend components, managing state lifecycles, optimizing rendering performance, or ensuring clean TypeScript typing.
---

# Frontend Engineering Skills

This skill codifies modern frontend engineering practices across React Native (Hermes engine) and Next.js applications.

## 1. Hermes & React Native Runtime Hygiene
- **Named Import Restrictions**: In React Native 0.74+ Hermes engine, avoid named imports from deep internal libraries (e.g. `react-native/Libraries/*`). Always import from the canonical `'react-native'` surface.
- **Type Safety**: Strictly zero TypeScript errors (`npx tsc --noEmit`). Keep interfaces explicit (`QueuedTelemetryRecord`, `FocusRingProps`, `TabKey`).
- **Clean Event Subscriptions**: All listeners (`AppState`, `Linking`, `NetInfo`) must return teardown cleanup functions in `useEffect` to prevent background memory leaks.

## 2. Component Decomposition
- **Modular Sub-views**: Separate heavy tabs into dedicated components (`TodayTab`, `InsightsTab`, `SettingsTab`) to isolate re-renders.
- **Pure Functional Tokens**: Centralize design variables into theme tokens rather than scattering magic color hexes across components.
