# Analytics Module

## 1. Folder Structure

```
apps/backend/src/modules/analytics/
├── controllers/analytics.controller.ts
├── services/analytics.service.ts
├── dto/analytics-dashboard.interface.ts   # response shape contract, not a validated request DTO
└── analytics.module.ts

apps/frontend/src/app/features/analytics/
├── models/dashboard.model.ts
├── services/analytics-api.service.ts
├── dashboard/
│   ├── analytics-dashboard.component.ts
│   ├── analytics-dashboard.component.html
│   └── analytics-dashboard.component.scss
└── analytics.routes.ts
```

## 2. Database Design

**None.** This is the one module in the platform with zero tables of its own — see
Business Logic for why that's a deliberate design choice, not an oversight.

## 3. API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/analytics/dashboard` | Cross-module summary: tasks, expenses, habits, goals, focus time |

Response shape (`AnalyticsDashboard`):
```ts
{
  tasks: { total, done, inProgress, todo, completionRate },
  expenses: { monthIncome, monthExpense, monthNet }, // integer minor units
  habits: { activeCount, averageCurrentStreak },
  goals: { activeCount, completedCount, averageProgress },
  focus: { todayMinutes, last7DaysMinutes },
}
```

## 4. Angular Components

- `AnalyticsDashboardComponent` — five stat cards (tasks, expenses, habits, goals,
  focus), reusing the same progress-bar visual pattern already established in the
  Goal Tracker and Habit Tracker modules for consistency.

## 5. UI Flow

1. User opens `/analytics`.
2. A single API call (`GET /analytics/dashboard`) returns everything the page needs —
   no separate round trip per widget, keeping the dashboard load to one request.
3. Cards render task completion rate, this month's income/expense/net, average habit
   streak, average goal progress, and today's + last-7-days focus minutes.

## 6. Validation Rules

None — this is a read-only, parameter-less GET endpoint. No request DTO is needed;
`analytics-dashboard.interface.ts` documents the response contract instead.

## 7. Business Logic

- **Analytics is a pure composition layer.** `AnalyticsService` injects the already-
  exported `TasksService`, `ExpensesService`, `HabitsService`, `GoalsService`, and
  `FocusService` from their respective modules and calls their existing public
  methods (`list()`, `summary()`, `todayStats()`, `history()`) — it never queries
  another module's repository or table directly. This is Clean Architecture applied
  across module boundaries: Analytics depends on stable service interfaces, so any
  future change to how (say) goal progress is calculated is automatically reflected
  here with zero duplicated logic.
- All five cross-module calls run via `Promise.all(...)` rather than sequentially,
  since none of them depend on each other's results — this keeps the single dashboard
  request fast even as more modules are added to it later.
- **This month's expense window** is computed as `[firstOfCurrentMonth, today]`
  inclusive, recalculated fresh on every request (no caching yet — see Future
  Improvements).
- **Last-7-days focus time** filters the existing focus session history in memory
  (already fetched via `FocusService.history()`) rather than adding a new
  repository query — a deliberate reuse of data already available rather than a new
  round trip.

## 8. Future Improvements

- **Caching**: recompute-per-request is fine at current scale but wasteful once a
  user has thousands of tasks/expenses; a short-TTL Redis cache
  (`analytics:dashboard:{userId}`, using the project's existing Redis connection)
  would be the natural next step.
- Time-range picker (currently "this month" for expenses and "last 7 days" for focus
  are hardcoded; a date-range selector would generalize this).
- Real charts (line/bar) instead of single-number stat cards — the current cards are
  intentionally simple to avoid introducing a new frontend charting dependency before
  it's justified by an actual need.
- Habit/mood correlation (cross-referencing Habit Tracker completions with Journal
  mood entries) once both modules' data volumes make that meaningful.
- Team-level analytics (aggregating across a Team Collaboration team's members)
  rather than only per-individual-user stats.
- Export dashboard data as CSV/PDF.

## 9. Testing Strategy

- **Unit**: `AnalyticsService.getDashboard` — mock all five injected services and
  assert the aggregation math (completion rate, average streak, average goal
  progress, last-7-days focus filtering) against known fixture data, independent of
  any real database.
- **Integration/e2e**: seed a user with a mix of tasks/expenses/habits/goals/focus
  sessions via their real endpoints, then hit `/analytics/dashboard` and assert the
  numbers match what was seeded — this is the strongest test here since it exercises
  the actual cross-module composition, not mocks.

## 10. Deployment Notes

- No new environment variables, database tables, or Docker services required.
- Because this module depends on five other modules' exported services, module
  initialization order matters only in the sense that NestJS's DI container
  resolves it automatically — no manual ordering is needed in `app.module.ts`.
