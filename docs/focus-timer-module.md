# Focus Timer Module

## 1. Folder Structure

```
apps/backend/src/modules/focus/
├── controllers/focus.controller.ts
├── services/focus.service.ts
├── repositories/focus.repository.ts
├── dto/
│   ├── start-session.dto.ts
│   └── complete-session.dto.ts
├── entities/focus-session.entity.ts
└── focus.module.ts

apps/frontend/src/app/features/focus/
├── models/focus-session.model.ts
├── services/focus-api.service.ts
├── timer/
│   ├── focus-timer.component.ts
│   ├── focus-timer.component.html
│   └── focus-timer.component.scss
└── focus.routes.ts
```

## 2. Database Design

Table: `focus_sessions` (extends shared `BaseEntity`)

| Column | Type | Notes |
|---|---|---|
| owner_id | uuid | indexed |
| task_id | uuid | nullable — optional link to a Task this session was spent on |
| type | enum(work, short_break, long_break) | default work |
| planned_minutes | int | the target duration when the session was started |
| actual_seconds | int | default 0 — filled in when the session ends |
| started_at | timestamptz | indexed |
| ended_at | timestamptz | nullable until completed/interrupted |
| status | enum(running, completed, interrupted) | default running |

## 3. API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/focus/sessions` | Recent session history (last 50) |
| GET | `/api/focus/sessions/stats/today` | Total focused seconds/minutes today (work sessions only) |
| POST | `/api/focus/sessions` | Start a new session (server records `startedAt`) |
| PATCH | `/api/focus/sessions/:id/complete` | End a session — records actual elapsed time and completed/interrupted status |

**Route ordering note:** `GET /stats/today` is a static sub-path under the same
resource, declared so it doesn't collide with any future `GET /:id` route.

## 4. Angular Components

- `FocusTimerComponent` — Pomodoro-style circular countdown (SVG ring progress),
  work/short-break/long-break tabs, start/stop controls, today's total + recent
  session history list.

## 5. UI Flow

1. User picks a session type (Work 25m / Short break 5m / Long break 15m — fixed
   presets in this pass).
2. Clicking **Start** calls `POST /focus/sessions` immediately (so a session is
   recorded server-side the moment it begins, not only on completion — this means an
   accidental tab close still leaves a `running` row, useful for future "were you
   actually focused" analytics).
3. A client-side `setInterval` ticks the countdown every second; the SVG ring
   progress is a pure function of elapsed/total time.
4. On natural completion or an explicit **Stop**, `PATCH .../complete` is called with
   the actual elapsed seconds and an `interrupted` flag — the backend is the source of
   truth for what actually happened, not just the planned duration.

## 6. Validation Rules

- `plannedMinutes`: integer 1–180 if provided (guards against a mistyped 3-digit value
  becoming a multi-hour "session").
- `actualSeconds`: required non-negative integer on complete.
- A session can only be completed once — completing an already-`completed`/`interrupted`
  session returns `400 Bad Request`.

## 7. Business Logic

- **Today's stat** only counts `type = work` sessions within `[localDayStart,
  localDayEnd)` — breaks intentionally don't count toward "focused time".
- Session lifecycle is `running → completed` or `running → interrupted`; there's no
  path back to `running`, so the state machine is simple and one-directional.
- The elapsed-seconds computation on the frontend (`totalSeconds - remainingSeconds`)
  is sent to the backend rather than trusting a client-side "session length" claim
  blindly forever — future hardening could re-derive elapsed time server-side from
  `startedAt` vs `endedAt` as a sanity check (see Future Improvements).

## 8. Future Improvements

- Server-side elapsed-time validation: compare client-reported `actualSeconds` against
  `endedAt - startedAt` and flag large discrepancies (clock drift/tampering).
- Configurable session lengths (currently fixed 25/5/15 presets).
- Auto-cycle work → short break → work → ... → long break (classic Pomodoro cadence)
  instead of manual type selection each time.
- Link focus sessions to Tasks in the UI (the `taskId` field exists on the backend;
  no picker in the frontend yet).
- Sound/notification on session completion (ties into the Notifications module).
- Weekly/monthly focus-time charts once the Analytics module exists.

## 9. Testing Strategy

- **Unit**: `FocusService` — rejecting a second `complete()` call on the same session,
  `todayStats` day-boundary correctness (a session just before/after midnight).
- **Integration/e2e**: start a session → complete it → assert it appears in history
  with `status: completed` and the correct `actualSeconds`.
- **Frontend**: countdown tick logic (mocked timers), ring progress calculation at
  0%/50%/100%, tab switching disabled while a session is running.

## 10. Deployment Notes

- No new environment variables or Docker services required.
- If auto-cycling or notification sounds are added (Future Improvements), no backend
  infra changes are needed — those are frontend-only enhancements.
