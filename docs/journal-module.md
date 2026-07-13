# Journal Module

## 1. Folder Structure

```
apps/backend/src/modules/journal/
├── controllers/journal.controller.ts
├── services/journal.service.ts
├── repositories/journal.repository.ts
├── dto/
│   ├── create-journal-entry.dto.ts
│   ├── update-journal-entry.dto.ts
│   └── query-journal.dto.ts
├── entities/journal-entry.entity.ts
└── journal.module.ts

apps/frontend/src/app/features/journal/
├── models/journal-entry.model.ts
├── services/journal-api.service.ts
├── list/
│   ├── journal-list.component.ts
│   ├── journal-list.component.html
│   └── journal-list.component.scss
└── journal.routes.ts
```

## 2. Database Design

Table: `journal_entries` (extends shared `BaseEntity`)

| Column | Type | Notes |
|---|---|---|
| owner_id | uuid | indexed |
| entry_date | date | **unique together with owner_id** — one entry per day per user |
| title | varchar(255) | nullable |
| content | text | default `''` |
| mood | smallint | nullable, 1 (very low) – 5 (great) |
| tags | simple-array | nullable |
| is_private | boolean | default false — reserved for a future "shareable journal" feature |
| ai_reflection | text | nullable — populated by future AI reflection/summary feature |

Composite unique index `(owner_id, entry_date)` is the core business rule enforced at
the database level, backstopped by an application-level check for a friendly error.

## 3. API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/journal/entries?from=&to=&page=&limit=` | Paginated list, optional date range |
| GET | `/api/journal/entries/:id` | Get one entry |
| POST | `/api/journal/entries` | Create today's (or a specific date's) entry |
| PATCH | `/api/journal/entries/:id` | Update an entry (entryDate is immutable) |
| DELETE | `/api/journal/entries/:id` | Soft-delete |

## 4. Angular Components

- `JournalListComponent` — mood-emoji picker, textarea for the day's entry, paginated
  timeline of past entries with delete.
- `JournalApiService` — HTTP wrapper unwrapping the `{data}` response envelope.

## 5. UI Flow

1. User opens `/journal`.
2. A "how was your day" composer at the top: pick a mood (1–5, shown as emoji), write
   free text, save.
3. Below, a reverse-chronological list of past entries with mood indicator.
4. Attempting a second entry for the same calendar day surfaces a friendly
   "you've already written today" message instead of a generic 500/409.

## 6. Validation Rules

- `entryDate`: required ISO date string on create; immutable on update (`UpdateJournalEntryDto`
  omits it via `OmitType`).
- `mood`: must be one of `1,2,3,4,5` if provided.
- `content`: optional string (an entry can start as mood-only).
- One entry per `(ownerId, entryDate)` — duplicate attempts return `409 Conflict`.

## 7. Business Logic

- Immutable `entryDate` reflects the real-world constraint that a journal entry belongs
  to the day it was written — editing content/mood is fine, but you can't "move" an
  entry to a different day (that would really be creating a new entry).
- Ownership enforced identically to Notes/Tasks/Calendar: every query is scoped by
  `ownerId`.

## 8. Future Improvements

- AI-generated weekly/monthly reflection summaries (`aiReflection` field is already in
  place to receive this).
- Mood trend chart (mood over time, correlated with Habit/Goal Tracker data once built).
- Rich text / markdown support in entry content.
- Optional entry sharing (`isPrivate` flag already reserved for this).
- Tag-based filtering and a tag cloud view.

## 9. Testing Strategy

- **Unit**: `JournalService` — duplicate-date rejection, immutability of `entryDate` on
  update, mood range validation.
- **Integration/e2e**: create entry for today → attempt duplicate (expect 409) → update
  mood → soft-delete → confirm removal from list.
- **Frontend**: mood picker state, empty-state rendering, error message on 409 response.

## 10. Deployment Notes

- No new environment variables or Docker services required.
- Recommend a periodic backup policy consideration for this table specifically, since
  journal content may be considered more sensitive than other modules — encryption at
  rest is already provided by managed Postgres (e.g. AWS RDS); application-level
  field encryption is a candidate future improvement if required by compliance needs.
