## Why

Users currently see only a single all-time average on their profile page with no visibility into how their performance has changed over time. An "averages over time" chart lets players see trends, track improvement, and stay motivated by visualizing progress across days, months, and year-to-date.

## What Changes

- Add a new `getAveragesOverTime(userId)` function to the stats module that computes daily and monthly average completion time series from existing Firestore data.
- Create a new `AveragesChart` UI component that renders a Chart.js line chart with three toggle-able views: Last 30 Days (daily), Year to Date (monthly), and Past 12 Months (monthly).
- Integrate the chart into the profile page between the Weekly Times section and the Stats Grid.
- Install `chart.js` and `react-chartjs-2` as new project dependencies.

## Capabilities

### New Capabilities
- `time-series-stats`: Server-side computation of daily and monthly average completion time series from existing user completion data, with three pre-computed views (30-day daily, YTD monthly, 12-month monthly). Excludes "Did Not Complete" entries.
- `averages-chart`: Client-side line chart component with view mode toggles, theme-aware colors, responsive layout, formatted tooltips, and an empty state for users with no data.

### Modified Capabilities

## Impact

- **Code**: `app/lib/stats.ts` (new function + interfaces), `app/profile/page.tsx` (new state, parallel fetch, JSX insertion), new file `app/components/ui/AveragesChart/index.tsx`.
- **Dependencies**: `chart.js` and `react-chartjs-2` added to `package.json`.
- **Data**: No new Firestore reads or collections — reuses existing `daily_completions` data via `getAllCompletions()`.
- **APIs**: No new API routes — all computation is client-side.
