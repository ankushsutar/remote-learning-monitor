# 04. Analytics Engine & Web Dashboard

## 1. Overview

The Aegis Web Management & Analytics Dashboard (`apps/dashboard`) is a real-time command center designed for educators, school administrators, and guardians. Built on **Next.js 14 (App Router)**, **React 18**, **Tailwind CSS**, and **Recharts**, it translates millions of raw telemetry interval rows into actionable educational insights, engagement metrics, and automated tamper alarms.

---

## 2. Analytics Mathematical Models & Heuristics

The analytics computation layer resides in `services/backend/src/services/analyticsService.ts`.

### 2.1 The Daily Focus Score Algorithm
The Daily Focus Score evaluates how constructively a student engages with their digital device throughout a 24-hour cycle.

#### Mathematical Definition:
$$\text{Focused Duration} = T_{\text{PRODUCTIVE}} + T_{\text{EDUCATIONAL}}$$

$$\text{Total Screen Time} = T_{\text{PRODUCTIVE}} + T_{\text{EDUCATIONAL}} + T_{\text{SOCIAL\_MEDIA}} + T_{\text{GAMING}} + T_{\text{ENTERTAINMENT}} + T_{\text{UNCLASSIFIED}}$$

$$\text{Daily Focus Score} = \begin{cases} 
100.0 & \text{if } \text{Total Screen Time} = 0 \\
\operatorname{round}\left(\frac{\text{Focused Duration}}{\text{Total Screen Time}} \times 100, 1\right) & \text{if } \text{Total Screen Time} > 0 
\end{cases}$$

#### Evaluation Thresholds:
- **90.0% – 100.0% (Exemplary)**: Dominant educational focus (e.g. Google Classroom, Khan Academy, Duolingo).
- **75.0% – 89.9% (Balanced)**: Healthy balance of study and minor unclassified/break utility apps.
- **50.0% – 74.9% (Needs Attention)**: Notable distraction during class sessions (e.g. YouTube, Discord).
- **< 50.0% (Critical Risk)**: Heavy gaming or social media usage during designated study hours.

---

### 2.2 24-Hour Timeline Heatmap Bucketing
To visualize *when* students are using specific applications, the backend aggregates intervals into **24 discrete hourly buckets** (`00:00` to `23:00`):

```typescript
// Query hourly buckets via PostgreSQL EXTRACT(HOUR FROM t.start_time)
const hours: TimelinePoint[] = [];
for (let h = 0; h < 24; h++) {
  hours.push({
    hour: `${h.toString().padStart(2, '0')}:00`,
    productive: 0,
    educational: 0,
    socialMedia: 0,
    gaming: 0,
    entertainment: 0,
    unclassified: 0
  });
}
```

#### Core Classroom Hours (08:00 – 15:00):
The timeline heatmap explicitly renders a visual boundary representing the school day:
- Highlights apps opened during active teaching sessions.
- Automatically separates after-school leisure time from classroom focus.

---

### 2.3 Bandwidth Anomaly & Spike Detection
Remote learning relies heavily on video conferencing (Google Meet, Zoom) and interactive web assignments. However, high-bandwidth streaming (Netflix, Twitch, YouTube 4K) or multi-gigabyte game updates can degrade school networks and signal severe distraction.

#### Anomaly Detection Rule:
$$\text{Classroom Spike Triggered} \iff \text{Hour} \in [08:00, 15:00) \land \left(\text{Category} \in \{\text{GAMING}, \text{ENTERTAINMENT}\} \land \text{Bytes}_{\text{Rx}} > 15 \text{ MB}\right)$$

When this condition is met:
- `classHourSpikesDetected` counter is incremented.
- The dashboard highlights the event with a red warning badge in the Bandwidth Consumption card.

---

### 2.4 Automated Tamper Detection Engine
Students or malicious actors may attempt to evade monitoring by:
1. Turning off network connectivity for extended periods.
2. Re-enabling Android Battery Optimization to let Doze mode kill the background worker.
3. Revoking Android Usage Access.

#### Tamper Evaluation Matrix:

| Tamper Condition | Threshold | Severity | System Action |
| :--- | :--- | :--- | :--- |
| **`SYNC_TIMEOUT`** | `Last Sync > 2 Hours` | **CRITICAL** | Flags student card in red; unlocks one-click "Send Guardian Warning" action. |
| **`BATTERY_OP_RE_ENABLED`** | `battery_optimization_disabled == false` | **WARNING** | Alerts administrators that Android Doze mode may kill future sync jobs. |
| **`USAGE_ACCESS_REVOKED`** | `AppOpsManager.MODE_ALLOWED == false` | **CRITICAL** | Prompts mobile notification demanding re-authorization. |

---

## 3. Web Dashboard Components Architecture

```
apps/dashboard/src/
├── app/
│   ├── page.tsx                  # Main analytics dashboard page
│   ├── layout.tsx                # Dark-mode dashboard wrapper
│   └── globals.css               # Tailwind styling & custom scrollbars
└── components/
    ├── StudentSelector.tsx       # Fleet overview vs individual student drill-down
    ├── DailyFocusScore.tsx       # Radial SVG progress gauge & category breakdown
    ├── TimelineHeatmap.tsx       # Recharts 24-hour stacked distribution bar chart
    ├── BandwidthConsumption.tsx  # Dual-axis area chart (Rx/Tx) & classroom spike badge
    ├── TamperAlertIndicator.tsx  # Real-time risk cards & guardian action triggers
    ├── CategoryBreakdownTable.tsx # Searchable, categorized per-app screen time table
    └── LiveTelemetryStream.tsx   # Server-Sent Events real-time batch stream
```

---

## 4. UI Component Deep Dive

### 4.1 Daily Focus Score Gauge (`DailyFocusScore.tsx`)
- **Radial SVG Gauge**: Uses dynamic stroke-dashoffset math to render an animated circular gauge.
- **Color Transitions**:
  - `score >= 85`: Emerald green gradient (`#10B981`)
  - `score >= 70`: Indigo gradient (`#6366F1`)
  - `score >= 50`: Amber warning gradient (`#F59E0B`)
  - `score < 50`: Rose danger gradient (`#EF4444`)
- **Category Proportion Bars**: Horizontal stacked bars showing the percentage contribution of each application type.

### 4.2 24-Hour Timeline Heatmap (`TimelineHeatmap.tsx`)
- **Stacked Bar Chart**: Powered by Recharts `<BarChart>` with customized tooltips.
- **Interactive Layers**: Individual bars for Educational (emerald), Productive (blue), Social (pink), Gaming (amber), and Entertainment (red).
- **Classroom Hours Banner**: Visual indicator framing the 08:00 – 15:00 window.

### 4.3 Network Bandwidth Analytics (`BandwidthConsumption.tsx`)
- **Dual Area Chart**: Visualizes upload (Tx) and download (Rx) rates over time.
- **Traffic Summaries**:
  - Total classroom hours data consumed.
  - Total after-hours data consumed.
  - Streaming anomaly count badge.

### 4.4 Tamper Alert Indicator (`TamperAlertIndicator.tsx`)
- Displays real-time status of all enrolled devices.
- Immediately isolates students with sync delays exceeding 2 hours.
- Includes a direct **Send Guardian Warning** button that dispatches alerts to parents.

### 4.5 Live Telemetry Stream (`LiveTelemetryStream.tsx`)
- Maintains an open EventSource connection to `/api/v1/telemetry/stream`.
- Whenever a student device syncs, an animated card slides in showing device ID, student name, interval count, and top active packages.
- Features a **"Simulate Client Batch Push"** button allowing administrators and reviewers to trigger instant synthetic telemetry batches.
