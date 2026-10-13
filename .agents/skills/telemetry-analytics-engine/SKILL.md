---
name: telemetry-analytics-engine
description: >-
  Procedures for managing, evaluating, and extending the Aegis Analytics Engine and Web Dashboard metrics.
  Use this skill whenever modifying Daily Focus Score formulas, adjusting 24-hour timeline bucketing, fine-tuning streaming/gaming anomaly thresholds, or implementing tamper alert heuristics.
---

# Telemetry Analytics Engine & Dashboard Metrics Skill

This skill defines the mathematical models, categorization standards, and alert heuristics implemented in `services/backend/src/services/analyticsService.ts` and rendered by `apps/dashboard`.

---

## 1. Daily Focus Score Formula

$$\text{Focus Score} = \begin{cases} 
100.0 & \text{if } \text{Total Screen Time} = 0 \\
\operatorname{round}\left(\frac{T_{\text{PRODUCTIVE}} + T_{\text{EDUCATIONAL}}}{\text{Total Screen Time}} \times 100, 1\right) & \text{if } \text{Total Screen Time} > 0 
\end{cases}$$

### Categories Monitored (`app_category_enum`):
- `PRODUCTIVE`: Learning management tools, calculators, note-taking.
- `EDUCATIONAL`: Khan Academy, Google Classroom, Canvas, Duolingo.
- `SOCIAL_MEDIA`: WhatsApp, Instagram, Discord, TikTok.
- `GAMING`: Roblox, Minecraft, casual games.
- `ENTERTAINMENT`: YouTube, Netflix, streaming video.
- `UNCLASSIFIED`: System settings, clock, launchers.

---

## 2. 24-Hour Timeline Heatmap Bucketing

- Group intervals into **24 hour buckets** (`00:00` through `23:00`).
- Convert durations from seconds to minutes for visualization.
- **Core Classroom Window**: `08:00 - 15:00` must always be highlighted visually in the UI to separate school hours from leisure time.

---

## 3. Classroom Bandwidth Spike Detection

Flag an anomaly whenever:
- Time is between **08:00 and 15:00** (school hours).
- App category is `GAMING` or `ENTERTAINMENT`.
- Inbound bytes (`bytesRx`) exceed **15 MB** (`CLASSROOM_BANDWIDTH_SPIKE_MB=15`).

---

## 4. Automated Tamper Detection Engine

Periodically evaluate all enrolled active devices:

| Tamper Code | Evaluation Rule | Severity |
| :--- | :--- | :--- |
| `SYNC_TIMEOUT` | `currentTime - lastSyncAt > 2 hours` (`TAMPER_SYNC_TIMEOUT_HOURS`) | **CRITICAL** |
| `BATTERY_OP_RE_ENABLED` | `batteryOptimizationDisabled == false` | **WARNING** |
| `USAGE_ACCESS_REVOKED` | Inability to query `UsageEvents` stream | **CRITICAL** |

---

## 5. Dashboard Testing & Compilation

When modifying dashboard charts or analytics routes:
```bash
# Typecheck dashboard
(cd apps/dashboard && npx tsc --noEmit)

# Build production bundle
(cd apps/dashboard && npm run build)
```
