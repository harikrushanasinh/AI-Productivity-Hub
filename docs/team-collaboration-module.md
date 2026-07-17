# Team Collaboration Module

## 1. Folder Structure

```
apps/backend/src/modules/teams/
├── controllers/teams.controller.ts
├── services/teams.service.ts
├── repositories/teams.repository.ts
├── dto/
│   ├── create-team.dto.ts
│   ├── update-team.dto.ts
│   ├── invite-member.dto.ts
│   ├── update-member-role.dto.ts
│   └── create-comment.dto.ts
├── entities/
│   ├── team.entity.ts
│   ├── team-member.entity.ts
│   ├── team-invite.entity.ts
│   └── comment.entity.ts
└── teams.module.ts

apps/frontend/src/app/features/teams/
├── models/team.model.ts
├── services/teams-api.service.ts
├── list/
│   ├── teams-list.component.ts
│   ├── teams-list.component.html
│   └── teams-list.component.scss
└── teams.routes.ts
```

## 2. Database Design

**`teams`** (extends shared `BaseEntity`)

| Column | Type | Notes |
|---|---|---|
| name | varchar(255) | required |
| description | text | nullable |
| owner_id | uuid | the creator — always mirrored as a `team_members` row with role OWNER |

**`team_members`**

| Column | Type | Notes |
|---|---|---|
| team_id | uuid | indexed, **unique together with user_id** — one membership row per user per team |
| user_id | uuid | indexed |
| role | enum(owner, admin, member) | default member |

**`team_invites`**

| Column | Type | Notes |
|---|---|---|
| team_id | uuid | indexed |
| email | varchar(255) | invitee's email |
| invited_by | uuid | |
| token | varchar(64) | **unique** — the invite acceptance token |
| status | enum(pending, accepted, declined, revoked) | default pending |

**`comments`** — deliberately polymorphic (see Business Logic)

| Column | Type | Notes |
|---|---|---|
| team_id | uuid | indexed — which team's context this comment belongs to |
| author_id | uuid | |
| entity_type | varchar(50) | indexed — `"task"`, `"note"`, `"goal"`, `"calendar_event"` |
| entity_id | uuid | indexed — the id of that Task/Note/Goal/etc. |
| content | text | |

## 3. API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/teams` | List teams the current user belongs to |
| GET | `/api/teams/:id` | Get one team (must be a member) |
| POST | `/api/teams` | Create a team (creator becomes owner) |
| PATCH | `/api/teams/:id` | Update (owner/admin) |
| DELETE | `/api/teams/:id` | Delete (owner only) |
| GET | `/api/teams/:id/members` | List members (must be a member) |
| POST | `/api/teams/:id/invitations` | Invite by email (owner/admin) |
| POST | `/api/teams/invitations/:token/accept` | Accept an invite (any authenticated user) |
| PATCH | `/api/teams/:id/members/:userId/role` | Change a member's role (owner only) |
| DELETE | `/api/teams/:id/members/:userId` | Remove a member (owner/admin; not self) |
| POST | `/api/teams/:id/leave` | Leave a team (not available to the owner) |
| GET | `/api/teams/:id/comments?entityType=&entityId=` | List comments on a resource |
| POST | `/api/teams/:id/comments` | Add a comment on a resource |

## 4. Angular Components

- `TeamsListComponent` — create-team bar, expandable team cards showing an
  invite-by-email field and the member list with role badges and remove/leave
  actions.
- `TeamsApiService` — HTTP wrapper.

## 5. UI Flow

1. User creates a team and is automatically its owner.
2. Expanding a team card loads its member list and reveals an "invite by email" field.
3. Since no email delivery is wired up yet, the invite token is surfaced directly in
   the UI (a banner showing the acceptance path) for manual sharing — a real product
   would email a clickable link containing this token instead.
4. Role changes and member removal are owner/admin-only; a user leaves via a
   dedicated "Leave" action rather than being allowed to "remove" themselves through
   the same endpoint as removing someone else (see Business Logic).

## 6. Validation Rules

- `name` (team): required, max 255 chars.
- `email` (invite): must be a valid email address.
- `role`: must be one of `owner`, `admin`, `member`.
- `entityType` (comment): restricted to a known allow-list (`task`, `note`, `goal`,
  `calendar_event`) rather than an arbitrary string, so a typo'd type can't silently
  create an orphaned comment thread nothing will ever query for.
- `content` (comment): required, max 4000 chars.

## 7. Business Logic

- **RBAC is team-scoped, not global.** A user's role (`owner`/`admin`/`member`) is
  per-team-membership, not a platform-wide attribute — the same user can be an owner
  of one team and a plain member of another. This is enforced entirely via the
  `requireMembership`/`requireRole` private helpers in `TeamsService`, checked before
  every mutating action.
- **Owners can't leave, only delete or (in a future improvement) transfer
  ownership** — this prevents a team from ending up ownerless. Removing yourself via
  the generic "remove member" endpoint is explicitly blocked
  (`ForbiddenException` if `targetUserId === requesterId`) to force use of the
  dedicated `/leave` endpoint, which carries the owner-specific guard.
- **Polymorphic comments** (`entityType` + `entityId` instead of a hard foreign key
  per resource) let this module add threaded discussion to Tasks, Notes, Goals, and
  Calendar events without any of those modules needing a `commentsModule` dependency
  or schema change — Team Collaboration is the only module that knows Comments exist.
- **Invites carry a random 48-hex-character token** generated via
  `crypto.randomBytes(24)` — long and unguessable enough to function as a bearer
  credential for the accept flow (equivalent to ~192 bits of entropy).

## 8. Future Improvements

- **Email delivery** for invitations (currently the token is only returned in the
  API response / surfaced in the frontend banner — no actual email is sent).
- **Ownership transfer** endpoint, so a departing owner isn't forced to delete the
  whole team.
- Invite expiry (`team_invites` has no `expiresAt` column yet — a token is valid
  indefinitely until accepted or explicitly revoked).
- Real-time comment updates via the Notifications module's Socket.IO gateway
  (currently comments are fetch-on-load only, no live push when a teammate comments).
- Shared team-owned resources (e.g. a team's shared Notes/Tasks board) — today,
  Team Collaboration only adds membership/roles/comments on top of existing
  personally-owned resources; it doesn't yet make a Task/Note itself team-shared.

## 9. Testing Strategy

- **Unit**: `TeamsService` — role-based authorization matrix (owner can delete,
  admin cannot; admin can invite, member cannot; owner cannot leave); the
  self-removal guard (`removeMember` rejecting `targetUserId === requesterId`).
- **Integration/e2e**: create team → invite → accept as a second user → assert
  membership → attempt an admin-only action as a plain member (expect 403) →
  promote to admin → retry (expect success).
- **Frontend**: expand/collapse team card state, invite-token banner rendering.

## 10. Deployment Notes

- No new environment variables or Docker services required for this pass.
- If email delivery for invitations is added (Future Improvements), it will need an
  SMTP/transactional-email provider (SES, Postmark, etc.) and corresponding
  environment variables — not yet present in `.env.example`.
