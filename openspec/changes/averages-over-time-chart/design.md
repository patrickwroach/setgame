## Context

The profile page (`/profile`) currently shows a single all-time average time as a `StatCard` and a weekly times list with day-by-day entries. Historical completion data is stored in Firestore at `daily_completions/{userId}` as a flat map of `{ [YYYY-MM-DD]: DailyCompletion }`. The existing `getAllCompletions(userId)` function returns this full map in one read. The project uses Next.js (app router), React 19, Tailwind CSS v4, and a light/dark theme system via `ThemeContext` (exposes `resolvedTheme: "light" | "dark"`). No charting library is currently installed.

## Goals / Non-Goals

**Goals:**
- Let users visualize how their average completion time has trended over time
- Support three views: Last 30 Days (daily granularity), Year to Date (monthly), Past 12 Months (monthly)
- Integrate seamlessly with the existing profile page layout and theme system
- Reuse existing Firestore data with no additional reads or collections

**Non-Goals:**
- Comparison charts against other users
- Server-side rendering of charts or image export
- Custom date range picker
- Rolling/moving average smoothing (raw averages only)

## Decisions

**1. Chart library: chart.js + react-chartjs-2**
- Rationale: User preference. Canvas-based, widely used, good React bindings.
- Alternatives considered: recharts (declarative but larger bundle), visx (too low-level), CSS-only bars (limited for line charts).

**2. Data computation: client-side from existing `getAllCompletions()`**
- Rationale: The completions document is already fetched for the profile page stats. Computing averages is O(n) over the entries — negligible even for 1000+ days. Avoids a new API route or Firestore index.
- Alternative: Server-side API route — rejected because no benefit for this data volume and adds complexity.

**3. Three fixed view modes instead of a date range picker**
- Rationale: Simpler UX, covers the most useful views (recent trend, yearly progress, long-term trend). A date range picker adds significant complexity for limited benefit.

**4. Exclude "Did Not Complete" entries from all chart data**
- Rationale: DNC entries don't have meaningful completion times. Including them would distort averages. Consistent with how `averageTime` is already computed in `getUserStats()`.

**5. Theme-aware chart colors via `resolvedTheme` from ThemeContext**
- Rationale: Chart.js doesn't natively read CSS custom properties. Reading `resolvedTheme` and switching between light/dark color constants ensures the chart is always legible.
- Alternative: `getComputedStyle()` to read CSS vars — fragile with SSR/hydration timing.

**6. `spanGaps: true` for connecting across null data points**
- Rationale: Days with no completion would break the line into disconnected segments, which is visually confusing. Connecting across gaps shows the overall trend clearly.

## Risks / Trade-offs

- **[Bundle size]** chart.js adds ~60KB gzipped → Acceptable for the feature value. Tree-shaking with selective registration mitigates this.
- **[Stale theme]** If user toggles theme while chart is visible, chart colors won't update until re-render → Mitigated by `resolvedTheme` being reactive state from context; component re-renders on change.
- **[Large completion history]** Users with very long histories fetch the entire completions map → Already the case for existing stats; no additional Firestore read introduced.
- **[Chart.js SSR]** Chart.js requires `<canvas>` (browser-only) → Component is `"use client"`, no SSR concern.
