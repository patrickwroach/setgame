## ADDED Requirements

### Requirement: Render line chart with view mode toggles
The `AveragesChart` component SHALL render a Chart.js line chart displaying average completion times over time. It SHALL provide three toggle buttons ("30 Days", "Year to Date", "12 Months") that switch the displayed dataset. The default view SHALL be "30 Days".

#### Scenario: Default render
- **WHEN** the component mounts with valid data
- **THEN** it SHALL display a line chart using the `daily` dataset with "30 Days" toggle active

#### Scenario: Switch to Year to Date
- **WHEN** the user clicks the "Year to Date" toggle button
- **THEN** the chart SHALL update to display the `ytd` dataset with monthly labels on the x-axis

#### Scenario: Switch to 12 Months
- **WHEN** the user clicks the "12 Months" toggle button
- **THEN** the chart SHALL update to display the `monthly` dataset with `"MMM 'YY"` labels on the x-axis

### Requirement: Handle empty state
The component SHALL display a centered "No completion data yet" message instead of a chart when the data is null or when all data points in the selected view have `null` avgTime values.

#### Scenario: Null data prop
- **WHEN** `data` prop is `null`
- **THEN** the component SHALL render the empty state message instead of a chart

#### Scenario: All null data points
- **WHEN** all `avgTime` values in the currently selected dataset are `null`
- **THEN** the component SHALL render the empty state message

### Requirement: Theme-aware styling
The component SHALL read `resolvedTheme` from `ThemeContext` and apply appropriate colors for the line, points, grid lines, and axis text. The chart SHALL remain legible in both light and dark themes.

#### Scenario: Dark mode
- **WHEN** `resolvedTheme` is "dark"
- **THEN** the chart line SHALL use the dark primary color, and grid/axis text SHALL use light colors

#### Scenario: Theme switch while chart is visible
- **WHEN** the user toggles theme while the chart is displayed
- **THEN** the chart SHALL re-render with updated colors matching the new theme

### Requirement: Formatted tooltips
Chart tooltips SHALL display the completion time formatted using `formatTime()` (e.g., "1:23.4" instead of raw seconds "83.4").

#### Scenario: Hover on data point
- **WHEN** the user hovers over a data point on the chart
- **THEN** a tooltip SHALL appear showing the formatted completion time

### Requirement: Responsive layout
The chart SHALL be responsive, filling the width of its container and maintaining a readable aspect ratio at all viewport widths.

#### Scenario: Mobile viewport
- **WHEN** the viewport width is below 768px
- **THEN** the chart SHALL shrink to fit the container while remaining legible

### Requirement: Span gaps across null data points
The chart SHALL use `spanGaps: true` so the line connects across days/months with no completion data, maintaining visual continuity.

#### Scenario: Non-consecutive completions
- **WHEN** a user has completions on day 1 and day 5 but not days 2-4
- **THEN** the line SHALL connect from day 1's point to day 5's point without breaking

### Requirement: Profile page integration
The chart SHALL be placed on the profile page between the Weekly Times section and the Stats Grid section, wrapped in a Card with the title "Average Time Over Time". Data SHALL be fetched in parallel with existing stats.

#### Scenario: Profile page load
- **WHEN** the profile page loads for an authenticated user
- **THEN** `getAveragesOverTime(userId)` SHALL be called in parallel with `getUserStats(userId)` and the chart SHALL render after data loads

#### Scenario: Loading state
- **WHEN** data is still loading
- **THEN** the chart section SHALL show a loading indicator consistent with the rest of the profile page
