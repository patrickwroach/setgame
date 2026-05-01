## ADDED Requirements

### Requirement: Compute daily time series
The system SHALL compute a daily time series of completion times for the last 30 calendar days. Each data point SHALL contain the calendar date label (formatted as `M/D`) and the completion time for that day, or `null` if no completed puzzle exists for that day. Only entries with `completed === true` SHALL be included. The series SHALL be sorted chronologically (oldest first).

#### Scenario: User with completions in the last 30 days
- **WHEN** `getAveragesOverTime(userId)` is called for a user with completed puzzles in the last 30 days
- **THEN** the `daily` array SHALL contain 30 entries, one per calendar day, with non-null `avgTime` values for days with completions and `null` for days without

#### Scenario: User with zero completions
- **WHEN** `getAveragesOverTime(userId)` is called for a user with no completed puzzles
- **THEN** the `daily` array SHALL contain 30 entries, all with `avgTime: null`

#### Scenario: DNC entries excluded
- **WHEN** a user has a "Did Not Complete" entry (completed === false) on a day
- **THEN** that day SHALL have `avgTime: null` in the daily series (the DNC is not counted as a completion)

### Requirement: Compute year-to-date monthly averages
The system SHALL compute monthly average completion times from January 1 of the current year through the current month. Each data point SHALL contain a month label (abbreviated month name, e.g., "Jan") and the mean completion time of all completed puzzles in that month, or `null` if no completions exist for that month.

#### Scenario: User with completions across multiple months this year
- **WHEN** `getAveragesOverTime(userId)` is called and the user has completions in January, March, and May
- **THEN** the `ytd` array SHALL contain one entry per month from January through the current month, with non-null averages for Jan/Mar/May and `null` for months with no completions

#### Scenario: Called in January with no data
- **WHEN** `getAveragesOverTime(userId)` is called in January for a user with no completions this year
- **THEN** the `ytd` array SHALL contain one entry for January with `avgTime: null`

### Requirement: Compute trailing 12-month averages
The system SHALL compute monthly average completion times for the trailing 12-month window ending at the current month. Each data point SHALL contain a month label formatted as `"MMM 'YY"` (e.g., "Jun '25") and the mean completion time, or `null` if no completions exist for that month.

#### Scenario: User with scattered completions over 12 months
- **WHEN** `getAveragesOverTime(userId)` is called and the user has completions in 5 of the last 12 months
- **THEN** the `monthly` array SHALL contain 12 entries with non-null averages for the 5 active months and `null` for the 7 inactive months

### Requirement: Return typed data structure
The function SHALL return an `AveragesOverTime` object containing three arrays: `daily`, `ytd`, and `monthly`, each of type `TimeSeriesPoint[]` where `TimeSeriesPoint` is `{ label: string; avgTime: number | null }`.

#### Scenario: Type contract
- **WHEN** `getAveragesOverTime(userId)` resolves
- **THEN** the result SHALL conform to the `AveragesOverTime` interface with all three arrays populated
