# Habit Tracker Module

## 1. Folder Structure

```
apps/backend/src/modules/habits/
├── controllers/habits.controller.ts
├── services/habits.service.ts
├── repositories/habits.repository.ts
├── dto/
│   ├── create-habit.dto.ts
│   ├── update-habit.dto.ts
│   └── log-habit.dto.ts
├── entities/
│   ├── habit.entity.ts
│   └── habit-log.entity.ts
└── habits.module.ts

apps/frontend/src/app/features/habits/
├── models/habit.model.ts
├── services/habits-api.service.ts
├── list/
│   ├── habits-list.component.ts
│   ├── habits-list.component.html
│   └── habits-list.component.scss
└── habits.routes.ts
```

## 2. Database Design

Two tables, both extending shared `BaseEntity`:

**`habits`**

| Column | Type | Notes |
|---|---|---|
| owner_id | uuid | indexed |
| name | varchar(255) | required |
| description | text | nullable |
| frequency | enum(daily, weekly) | default daily |
| target_per_period | int | default 1; for weekly habits, times/week required |
| color | varchar(20) | hex color, default `#6366f1` |
| is_archived | boolean | default false |

**`habit_logs`** (one row per check-in)

| Column | Type | Notes |
|---|---|---|
| habit_id | uuid | indexed |
| owner_id | uuid | indexed (denormalized for query simplicity/ownership checks) |
| completed_on | date | **unique together with habit_id** — one check-in per day per habit |
| note | text | nullable |

## 3. API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/habits` | List habits, each annotated with current/longest streak + today status |
| GET | `/api/habits/:id` | Get one habit |
| POST | `/api/habits` | Create a habit |
| PATCH | `/api/habits/:id` | Update a habit |
| POST | `/api/habits/:id/log` | Check in for today (or `completedOn` body field) |
| DELETE | `/api/habits/:id/log?completedOn=` | Remove a check-in |
| DELETE | `/api/habits/:id` | Soft-delete a habit |

## 4. Angular Components

- `HabitsListComponent` — card grid, one card per habit: colored dot, name, current/best
  streak, a single toggle button ("Mark done today" ↔ "✓ Done today").
- `HabitsApiService` — thin HTTP wrapper.

## 5. UI Flow

1. User opens `/habits`.
2. Quick-add bar creates a new daily habit by name.
3. Each card shows the streak at a glance and a single-tap toggle for today's check-in —
   the core habit-tracking interaction is deliberately reduced to one tap.
4. Un-tapping removes today's log (in case of a mis-tap), recalculating the streak.

## 6. Validation Rules

- `name`: required, max 255 chars.
- `targetPerPeriod`: integer 1–21 (an upper bound sanity check, not a hard product rule).
- `color`: must be valid hex if provided.
- Duplicate check-ins for the same `(habitId, completedOn)` are rejected with `409`.

## 7. Business Logic — Streak Calculation

This is the interesting part of this module, implemented in `HabitsService.computeStreaks`:

- **Longest streak**: sort all logged dates, walk through them, and count the longest
  run of consecutive calendar days (day-diff of exactly 1).
- **Current streak**: walk backward from *today* — but if today hasn't been logged yet,
  start from *yesterday* instead. This means a habit's streak doesn't visually "break"
  the moment midnight passes; it only breaks once a full day is actually missed. The
  moment the user misses two consecutive days, the streak correctly resets to 0.
- Both calculations run in-memory over a habit's logs (not a DB window function) since
  per-habit log volume is small (≤366/year); this keeps the query simple and portable
  across Postgres versions. Documented here so a future contributor knows this was a
  deliberate simplicity trade-off, not an oversight.

## 8. Future Improvements

- Weekly-frequency streak logic currently only tracks daily consecutive-day streaks;
  extend `computeStreaks` to evaluate `targetPerPeriod` against ISO week buckets for
  `frequency: weekly` habits.
- Habit reminders via the Notifications module (e.g. "you haven't logged today").
- Visual heatmap (GitHub-contributions-style) of the last 90 days per habit.
- Archiving UI (`isArchived` field exists; no frontend affordance yet — currently only
  reachable via direct API/PATCH).
- Correlate habit completion with Journal mood entries for the AI Assistant to surface
  insights ("your mood tends to be higher on days you exercise").

## 9. Testing Strategy

- **Unit**: `computeStreaks` — the trickiest logic in this module. Test cases: no logs
  (0/0), a single log today (streak 1), a 5-day consecutive run ending yesterday
  (streak 5, today not yet logged), a broken run (gap of 2+ days resets to 0), longest
  streak differing from current streak.
- **Integration/e2e**: create habit → log today → attempt duplicate log (expect 409) →
  unlog → confirm `completedToday` flips back to false.
- **Frontend**: toggle button interaction (log ↔ unlog), streak display formatting.

## 10. Deployment Notes

- No new environment variables or Docker services required.
- Because streak computation loads all logs for a habit into memory, no additional
  index beyond the existing `(habit_id, completed_on)` unique index is required at
  current expected scale; revisit if a "lifetime" habit accumulates unusually large
  log volume.
