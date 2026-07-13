# Calendar Module

## 1. Folder Structure

```
apps/backend/src/modules/calendar/
├── controllers/calendar.controller.ts
├── services/calendar.service.ts
├── repositories/calendar.repository.ts
├── dto/
│   ├── create-event.dto.ts
│   ├── update-event.dto.ts
│   └── query-events.dto.ts
├── entities/event.entity.ts
└── calendar.module.ts

apps/frontend/src/app/features/calendar/
├── models/event.model.ts
├── services/calendar-api.service.ts
├── month-view/
│   ├── calendar-month.component.ts
│   ├── calendar-month.component.html
│   └── calendar-month.component.scss
└── calendar.routes.ts
```

## 2. Database Design

Table: `calendar_events` (extends the shared `BaseEntity`: `id` UUID PK, `created_at`,
`updated_at`, `deleted_at`, `created_by`, `updated_by`)

| Column | Type | Notes |
|---|---|---|
| owner_id | uuid | indexed, FK-equivalent to `users.id` (enforced at query layer) |
| title | varchar(255) | required |
| description | text | nullable |
| start_at | timestamptz | indexed |
| end_at | timestamptz | must be > start_at (enforced in service) |
| all_day | boolean | default false |
| location | varchar(255) | nullable |
| recurrence | enum(none, daily, weekly, monthly, yearly) | default none |
| color | varchar(20) | hex color, default `#6366f1` |
| reminder_minutes_before | int | nullable — powers the AI Smart Reminder feature |

Soft delete via `deleted_at`; TypeORM's `softDelete` is used instead of hard deletes.

## 3. API Endpoints

All routes require `Authorization: Bearer <accessToken>` (global `JwtAuthGuard`).

| Method | Path | Description |
|---|---|---|
| GET | `/api/calendar/events?from=&to=` | List events, optional ISO date range filter |
| GET | `/api/calendar/events/:id` | Get one event |
| POST | `/api/calendar/events` | Create an event |
| PATCH | `/api/calendar/events/:id` | Update an event |
| DELETE | `/api/calendar/events/:id` | Soft-delete an event |

Response envelope (via global `TransformInterceptor`): `{ data, statusCode, timestamp }`.
Errors: `{ statusCode, message, error, path, timestamp }`.

## 4. Angular Components

- `CalendarMonthComponent` — signal-driven month grid (42-cell layout including
  leading/trailing days from adjacent months), quick-add bar, event chips per day,
  click-to-delete on a chip, prev/next month navigation.
- `CalendarApiService` — thin HTTP wrapper, unwraps the backend's `{data}` envelope.

## 5. UI Flow

1. User lands on `/calendar` (lazy-loaded, guarded by `authGuard`, rendered inside `ShellComponent`).
2. Component fetches events for a 3-month window around the current month (covers days
   from adjacent months visible in the 42-cell grid).
3. Quick-add bar creates a 30-minute event at 09:00 on the chosen date; full create/edit
   forms with time pickers and recurrence are a natural follow-up enhancement.
4. Clicking an event chip deletes it (with `stopPropagation` so it doesn't fall through
   to a future "open day" handler).

## 6. Validation Rules

- `title`: required, string, max 255 chars.
- `startAt` / `endAt`: required ISO date strings; **service-layer** check ensures
  `endAt > startAt` (cross-field checks aren't expressed cleanly via class-validator alone).
- `color`: must be a valid hex color if provided.
- `reminderMinutesBefore`: integer between 0 and 10080 (7 days) if provided.
- Global `ValidationPipe` strips unknown fields (`whitelist: true`) and rejects extras
  (`forbidNonWhitelisted: true`).

## 7. Business Logic

- Ownership is enforced at the repository query level (`WHERE ownerId = :ownerId`) —
  a user can never fetch, update, or delete another user's event via ID.
- Range queries widen automatically: the frontend requests a 3-month window so month
  navigation feels instant without a request on every render; the backend performs the
  actual date filtering.
- Recurrence is stored as metadata only in this pass; materializing recurring instances
  (e.g. via a background job) is listed under Future Improvements.

## 8. Future Improvements

- Expand `recurrence` into materialized event instances (a scheduled job or on-read
  expansion) rather than storing it as an inert enum.
- Week/day views in addition to the month grid.
- Drag-to-reschedule and drag-to-resize on the grid.
- Integration with the AI Assistant module for natural-language event creation
  ("meeting with Sam next Tuesday at 3pm").
- Push/email delivery for `reminderMinutesBefore` via a Redis-backed job queue (Bull).
- Shared/team calendars once the Team Collaboration module exists.

## 9. Testing Strategy

- **Unit**: `CalendarService` — range validation (`endAt > startAt`), ownership checks
  on update/remove, default value application (`color`, `recurrence`).
- **Integration/e2e**: full CRUD lifecycle against a test Postgres instance — create →
  fetch by range → update → soft-delete → confirm it no longer appears in list queries.
- **Frontend**: `CalendarMonthComponent` — grid generation for a known month (verify 42
  cells, correct leading/trailing days, correct `isToday` flag), event-to-day matching.

## 10. Deployment Notes

- No new environment variables required; uses the existing `DB_*` connection.
- No new Docker services required — the module runs inside the existing `backend`
  container defined in root `docker-compose.yml`.
- When materialized recurrence / reminder delivery ships (see Future Improvements), a
  `worker` service using the existing Redis/Bull setup should be added to
  `docker-compose.yml`.
