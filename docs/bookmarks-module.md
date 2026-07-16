# Bookmarks Module

## 1. Folder Structure

```
apps/backend/src/modules/bookmarks/
├── controllers/bookmarks.controller.ts
├── services/bookmarks.service.ts
├── repositories/bookmarks.repository.ts
├── dto/
│   ├── create-bookmark.dto.ts
│   ├── update-bookmark.dto.ts
│   └── query-bookmarks.dto.ts
├── entities/bookmark.entity.ts
└── bookmarks.module.ts

apps/frontend/src/app/features/bookmarks/
├── models/bookmark.model.ts
├── services/bookmarks-api.service.ts
├── list/
│   ├── bookmarks-list.component.ts
│   ├── bookmarks-list.component.html
│   └── bookmarks-list.component.scss
└── bookmarks.routes.ts
```

## 2. Database Design

Table: `bookmarks` (extends shared `BaseEntity`)

| Column | Type | Notes |
|---|---|---|
| owner_id | uuid | indexed |
| url | varchar(2048) | required, validated as a well-formed URL with protocol |
| title | varchar(255) | required |
| description | text | nullable |
| favicon_url | varchar(2048) | nullable — auto-derived on create (see Business Logic) |
| folder | varchar(100) | indexed, default `'General'` |
| tags | simple-array | nullable |
| is_favorite | boolean | default false |

## 3. API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/bookmarks?search=&folder=&tag=` | List, filterable by free-text search, folder, or tag |
| GET | `/api/bookmarks/:id` | Get one bookmark |
| POST | `/api/bookmarks` | Save a bookmark |
| PATCH | `/api/bookmarks/:id` | Update (including toggling `isFavorite`) |
| DELETE | `/api/bookmarks/:id` | Delete permanently is NOT exposed — this is a soft-delete like every other module |

## 4. Angular Components

- `BookmarksListComponent` — search bar, quick-add (URL + title), card grid with
  favicon, folder tag, favorite star toggle, delete.
- `BookmarksApiService` — HTTP wrapper.

## 5. UI Flow

1. User pastes a URL and a title, clicks Save.
2. Cards render with an auto-fetched favicon, sorted favorites-first then newest-first.
3. Clicking a card opens the link in a new tab (`target="_blank" rel="noopener"` for
   security — never let a bookmarked page control the opener window).
4. The star and delete buttons call `$event.preventDefault()` so clicking them doesn't
   also trigger the anchor's navigation.

## 6. Validation Rules

- `url`: must be a well-formed URL **with an explicit protocol** (`require_protocol:
  true`) — prevents `javascript:` or protocol-relative edge cases and ensures the
  favicon-derivation logic can always parse a hostname.
- `title`: required, max 255 chars.
- `folder`: max 100 chars, defaults to `'General'` if omitted.

## 7. Business Logic

- **Favicon auto-derivation**: on create, the backend derives `faviconUrl` from
  Google's public favicon endpoint (`https://www.google.com/s2/favicons?domain=...`)
  using the hostname parsed out of the submitted URL. This avoids standing up any
  screenshot/favicon-scraping infrastructure of our own for a cosmetic feature.
- Sorting is favorites-first, then newest-first, so pinned/starred links surface
  without needing a separate "favorites" view.

## 8. Future Improvements

- Folder management UI (currently folder is just a free-text field; no dedicated
  "create/rename/delete folder" flow or folder picker in the create form).
- Browser extension / "Claude in Chrome"-style one-click save from any page.
- Full-text search against `description` in addition to `title`/`url` (currently only
  title/url are matched).
- Duplicate-URL detection with a friendly "you already saved this" prompt.
- AI-generated summary/tags for a saved page (ties into the AI Assistant module).

## 9. Testing Strategy

- **Unit**: `BookmarksService.create` — favicon hostname derivation for a range of
  URLs (with/without path, with query strings, subdomains).
- **Integration/e2e**: create with valid URL → assert 201 and non-null `faviconUrl`;
  create with a protocol-less string (e.g. `"example.com"`) → assert 400.
- **Frontend**: favorite toggle round-trip, search debounce/submit behavior, delete
  button not triggering navigation (`preventDefault` behavior).

## 10. Deployment Notes

- No new environment variables or Docker services required.
- The favicon derivation makes an external call to `google.com` from the **browser**
  (it's just an `<img src>`, not a backend fetch) — no outbound network permission
  needed on the API side; only the frontend's CSP (if configured) needs to allow
  `www.google.com` as an image source.
