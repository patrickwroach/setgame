## 1. Dependencies

- [x] 1.1 Install `chart.js` and `react-chartjs-2` via npm

## 2. Data Layer

- [x] 2.1 Add `TimeSeriesPoint` and `AveragesOverTime` interfaces to `app/lib/stats.ts`
- [x] 2.2 Implement `getAveragesOverTime(userId)` function in `app/lib/stats.ts` — compute daily (30 days), ytd (monthly), and monthly (12 months) time series from `getAllCompletions()`, excluding DNC entries

## 3. Chart Component

- [x] 3.1 Create `app/components/ui/AveragesChart/index.tsx` — register Chart.js modules, render `<Line>` chart with view mode toggle buttons (30 Days / Year to Date / 12 Months), theme-aware colors via `resolvedTheme`, formatted tooltips using `formatTime()`, `spanGaps: true`, responsive layout, and empty state

## 4. Profile Page Integration

- [x] 4.1 Add `averages` state and fetch `getAveragesOverTime(user.uid)` in parallel with `getUserStats(user.uid)` in `app/profile/page.tsx`
- [x] 4.2 Insert `<AveragesChart>` in a Card between Weekly Times and Stats Grid sections in `app/profile/page.tsx`

## 5. Verification

- [x] 5.1 Run `npm run build` and confirm no TypeScript or build errors
