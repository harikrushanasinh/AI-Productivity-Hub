# Notifications Module

## 1. Folder Structure

```
apps/backend/src/modules/notifications/
├── controllers/notifications.controller.ts
├── services/notifications.service.ts
├── repositories/notifications.repository.ts
├── gateways/notifications.gateway.ts   # Socket.IO, JWT-authenticated
├── dto/create-notification.dto.ts
├── entities/notification.entity.ts
└── notifications.module.ts

apps/frontend/src/app/features/notifications/
├── models/notification.model.ts
├── services/
│   ├── notifications-api.service.ts     # REST (history, read-state)
│   └── notifications-socket.service.ts  # Socket.IO (real-time push)
└── bell/
    ├── notification-bell.component.ts
    ├── notification-bell.component.html
    └── notification-bell.component.scss
```

## 2. Database Design

Table: `notifications` (extends shared `BaseEntity`)

| Column | Type | Notes |
|---|---|---|
| owner_id | uuid | indexed — the recipient |
| type | enum(info, reminder, mention, system) | default info |
| title | varchar(255) | required |
| message | text | nullable |
| link | varchar(255) | nullable — deep link the frontend navigates to on click |
| source_module | varchar(50) | nullable — e.g. `"tasks"`, `"calendar"`, for icon/filter purposes |
| is_read | boolean | indexed, default false |

## 3. API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/notifications` | List the most recent 50 notifications |
| GET | `/api/notifications/unread-count` | Unread count for a badge indicator |
| POST | `/api/notifications` | Create a notification (see Business Logic — usually called internally) |
| PATCH | `/api/notifications/:id/read` | Mark one as read |
| PATCH | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/:id` | Soft-delete |

### WebSocket

| Namespace | Event | Direction | Payload |
|---|---|---|---|
| `/notifications` | (connection) | client → server | `{ auth: { token: '<accessToken>' } }` |
| `/notifications` | `notification` | server → client | The full `Notification` row, the instant it's created |

## 4. Angular Components

- `NotificationBellComponent` — bell icon with an unread-count badge and a
  dropdown list; connects the Socket.IO service on init and merges real-time
  pushes into the same list the REST call populated.
- `NotificationsSocketService` — owns the Socket.IO connection lifecycle;
  exposes the latest pushed notification as a signal for any component to react to.
- `NotificationsApiService` — REST history/read-state.

## 5. UI Flow

1. On app shell load, the bell component connects to `/notifications` over
   Socket.IO (using the same JWT access token already used for REST calls) and
   fetches initial history + unread count over REST.
2. When any backend module calls `NotificationsService.create(...)`, the row is
   persisted **and** pushed live to that user's socket room in the same call —
   the bell's badge count increments in real time without polling.
3. Clicking a notification marks it read (both locally and via `PATCH .../read`);
   "Mark all read" clears the whole badge in one call.

## 6. Validation Rules

- `title`: required, max 255 chars.
- `ownerId`: required, must be a valid UUID (the recipient).
- `type`, `link`, `sourceModule`: optional, length-capped strings.

## 7. Business Logic

- **This module is primarily an internal API for other modules**, not an
  end-user-facing "create notification" form. The intended call pattern is other
  services injecting `NotificationsService` and calling `.create({ ownerId, title,
  ... })` directly — e.g. a future Calendar reminder job, or a Team Collaboration
  @mention handler. The REST `POST` endpoint exists for completeness/admin/testing.
- **Per-user Socket.IO rooms**: a socket joins a room named exactly after the
  authenticated user's ID (`payload.sub`) on connect. Emitting is always scoped to
  `server.to(ownerId).emit(...)` — there is no broadcast-to-all path, so one user's
  notifications are structurally unreachable by another user's socket.
- **Auth happens once, at `handleConnection`**: a socket that fails JWT
  verification is disconnected immediately rather than allowed to linger
  unauthenticated.

## 8. Future Improvements

- Wire actual producers: Calendar reminders (`reminderMinutesBefore`), Habit
  "you haven't logged today" nudges, Goal deadline warnings, Team Collaboration
  @mentions — all currently have no code calling `NotificationsService.create()`
  yet; this module ships the delivery mechanism, not the triggers.
- Push notifications (browser Push API / mobile) in addition to in-app + socket.
- Notification preferences (per-type opt-out) per user.
- Pagination for notification history beyond the most recent 50.
- Reconnection/backoff handling in `NotificationsSocketService` (currently a
  single `io()` call with no retry policy beyond Socket.IO's defaults).

## 9. Testing Strategy

- **Unit**: `NotificationsService.create` — asserts both the repository save AND
  `gateway.emitToUser` are called with the correct owner/payload (gateway mocked).
- **Integration/e2e**: create a notification via REST → assert it appears in
  `GET /notifications` and increments `unread-count` → mark read → assert count
  decrements → mark-all-read → assert count is 0.
- **Gateway**: a socket connecting without a token (or with a malformed/expired
  one) is disconnected; a socket with a valid token successfully joins its room
  (verified via a test client in a WebSocket-specific test, not included in the
  default e2e suite since it requires a running Socket.IO client).

## 10. Deployment Notes

- No new environment variables required beyond the existing `JWT_SECRET` (reused
  to verify socket handshake tokens) and `CORS_ORIGIN` (reused for the gateway's CORS
  config).
- **Horizontal scaling note**: this gateway keeps room membership in the single
  Node process's memory. If the backend is scaled to multiple instances, Socket.IO
  needs a Redis adapter (`@socket.io/redis-adapter`) so a notification created on
  instance A can reach a socket connected to instance B — the project's Redis
  instance (already in `docker-compose.yml`) is the natural fit; not yet wired up.
