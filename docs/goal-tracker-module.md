# Goal Tracker Module

## 1. Folder Structure

```
apps/backend/src/modules/goals/
├── controllers/goals.controller.ts
├── services/goals.service.ts
├── repositories/goals.repository.ts
├── dto/
│   ├── create-goal.dto.ts
│   ├── update-goal.dto.ts
│   └── create-milestone.dto.ts
├── entities/
│   ├── goal.entity.ts
│   └── goal-milestone.entity.ts
└── goals.module.ts

apps/frontend/src/app/features/goals/
├── models/goal.model.ts
├── services/goals-api.service.ts
├── list/
│   ├── goals-list.component.ts
│   ├── goals-list.component.html
│   └── goals-list.component.scss
└── goals.routes.ts
```

## 2. Database Design

**`goals`** (extends shared `BaseEntity`)

| Column | Type | Notes |
|---|---|---|
| owner_id | uuid | indexed |
| title | varchar(255) | required |
| description | text | nullable |
| category | enum(career, health, finance, personal, learning, other) | default other |
| target_date | date | nullable |
| status | enum(active, completed, abandoned) | indexed, default active |
| progress_percent | int | 0–100, manual fallback (see Business Logic) |

**`goal_milestones`**

| Column | Type | Notes |
|---|---|---|
| goal_id | uuid | indexed |
| title | varchar(255) | required |
| is_done | boolean | default false |
| sort_order | int | default 0 — reserved for drag-reorder (not yet exposed in UI) |

## 3. API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/goals` | List goals with milestone-derived progress |
| GET | `/api/goals/:id` | Get one goal + its milestones |
| POST | `/api/goals` | Create a goal |
| PATCH | `/api/goals/:id` | Update a goal (title, status, manual progress, etc.) |
| DELETE | `/api/goals/:id` | Soft-delete a goal (cascades logically — milestones remain but are orphaned; see Future Improvements) |
| POST | `/api/goals/:id/milestones` | Add a milestone |
| PATCH | `/api/goals/:id/milestones/:milestoneId/toggle` | Toggle done/not-done |
| DELETE | `/api/goals/:id/milestones/:milestoneId` | Remove a milestone |

## 4. Angular Components

- `GoalsListComponent` — goal cards with a progress bar, status badge, inline
  milestone checklist, and a per-goal "add milestone" input.
- `GoalsApiService` — HTTP wrapper.

## 5. UI Flow

1. User opens `/goals`, adds a goal by title.
2. Inside each goal card, the user can add lightweight milestones (sub-tasks).
3. Checking off milestones visually updates the progress bar immediately (progress is
   **derived**, not separately tracked, once milestones exist).
4. A goal with zero milestones still shows a progress bar driven by the manual
   `progressPercent` field, settable via `PATCH`.

## 6. Validation Rules

- `title` (goal and milestone): required, max 255 chars.
- `progressPercent`: integer 0–100 if manually set.
- `status`: must be one of the enum values.
- `targetDate`: valid ISO date if provided.

## 7. Business Logic

- **Progress precedence**: if a goal has one or more milestones, `computedProgress` is
  `round(doneCount / totalCount * 100)` — milestones are the source of truth. Only
  goals with **zero** milestones fall back to the manually-set `progressPercent`. This
  avoids the confusing state of a user checking off all milestones but the goal card
  still showing a stale manual percentage.
- **Status/progress sync**: setting `status: completed` force-sets `progressPercent`
  to 100; conversely, explicitly setting `progressPercent: 100` (without an explicit
  status) auto-promotes the goal to `completed`. Both directions are handled so the
  two fields never visibly disagree.

## 8. Future Improvements

- Cascade-delete milestones when a goal is soft-deleted (currently they're orphaned in
  the table, unreachable via the API but not physically removed — acceptable for now
  since soft-delete is reversible, but worth a cleanup job).
- Drag-to-reorder milestones (the `sortOrder` column already exists for this).
- Link goals to Habits (e.g. "Run 3x/week" habit contributing to a "Run a marathon" goal).
- AI-suggested milestone breakdown ("split this goal into milestones for me").
- Goal reminders / deadline notifications via the Notifications module.

## 9. Testing Strategy

- **Unit**: `GoalsService.withProgress` — milestone-derived vs manual-progress fallback,
  the completed⇄100% bidirectional sync logic.
- **Integration/e2e**: create goal → add 2 milestones → toggle 1 done → assert
  `computedProgress === 50` → toggle the 2nd → assert `computedProgress === 100` and
  goal auto-marked `completed` is intentionally NOT asserted (only explicit
  `progressPercent` updates trigger that path — milestone completion currently doesn't
  auto-flip status; see Future Improvements for wiring that up if desired).
- **Frontend**: progress bar width binding, milestone checkbox toggle round-trip.

## 10. Deployment Notes

- No new environment variables or Docker services required.
