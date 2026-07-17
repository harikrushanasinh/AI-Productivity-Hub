# Password Vault Module

## 1. Folder Structure

```
apps/backend/src/core/crypto/
├── encryption.service.ts    # shared AES-256-GCM helper (@Global module)
└── crypto.module.ts

apps/backend/src/modules/vault/
├── controllers/vault.controller.ts
├── services/vault.service.ts
├── repositories/vault.repository.ts
├── dto/
│   ├── create-vault-item.dto.ts
│   └── update-vault-item.dto.ts
├── entities/vault-item.entity.ts
└── vault.module.ts

apps/frontend/src/app/features/vault/
├── models/vault-item.model.ts
├── services/vault-api.service.ts
├── list/
│   ├── vault-list.component.ts
│   ├── vault-list.component.html
│   └── vault-list.component.scss
└── vault.routes.ts
```

## 2. Database Design

Table: `vault_items` (extends shared `BaseEntity`)

| Column | Type | Notes |
|---|---|---|
| owner_id | uuid | indexed |
| title | varchar(255) | e.g. "GitHub" — required |
| username | varchar(255) | nullable, stored in plaintext (not a secret by itself) |
| url | varchar(2048) | nullable |
| category | enum(login, card, note, other) | default login |
| is_favorite | boolean | default false |
| password_ciphertext | text | AES-256-GCM ciphertext, base64 |
| password_iv | varchar(64) | base64 IV, unique per encryption |
| password_auth_tag | varchar(64) | base64 GCM auth tag (integrity check) |
| notes_ciphertext / notes_iv / notes_auth_tag | text/varchar/varchar | same scheme, nullable, for optional secure notes |

**The password (and notes) plaintext is never written to any column.** Only
ciphertext + IV + auth tag are persisted.

## 3. API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/vault/items` | List items — **metadata only**, no secrets |
| GET | `/api/vault/items/:id` | Get one item — still metadata only |
| POST | `/api/vault/items` | Create (password encrypted server-side before the DB write) |
| PATCH | `/api/vault/items/:id` | Update (re-encrypts if password/notes changed) |
| DELETE | `/api/vault/items/:id` | Soft-delete |
| POST | `/api/vault/items/:id/reveal` | **The only endpoint that ever decrypts and returns a secret** |

The `/reveal` endpoint has its own independent rate limit (`@Throttle`: 10 requests/
60s) layered on top of the app's global throttle — specifically to slow down
brute-force reveal attempts even from a session that's already authenticated.

## 4. Angular Components

- `VaultListComponent` — item list showing masked `••••••••` by default; a
  **Reveal** button calls the `/reveal` endpoint on demand and auto-hides the
  plaintext again after 15 seconds (`AUTO_HIDE_MS`), whether or not the user
  manually hides it first.

## 5. UI Flow

1. User adds an item (title, optional username, password). The plaintext password
   is sent over HTTPS to the API for encryption — it is never encrypted client-side
   in this implementation (see Future Improvements for a zero-knowledge alternative).
2. The list view shows only metadata — masked password placeholder, no ciphertext,
   no way to derive the secret from what's rendered.
3. Tapping **Reveal** makes exactly one API call to decrypt and display the password;
   a timer automatically re-masks it 15 seconds later even if the user forgets.

## 6. Validation Rules

- `password`: required, non-empty string (no arbitrary complexity policy enforced
  server-side — this is a storage vault, not a password-strength gate).
- `url`: must include an explicit protocol if provided.
- `title`: required, max 255 chars.
- `VAULT_ENCRYPTION_KEY` (environment): the app **refuses to start** (`Error` thrown
  in `EncryptionService.onModuleInit`) if this is unset or shorter than 16 characters
  — a missing/weak vault key is treated as a startup-blocking misconfiguration, not a
  silent fallback.

## 7. Business Logic — Encryption Design

- **AES-256-GCM** is used for authenticated encryption: GCM's auth tag detects any
  tampering with the ciphertext (a corrupted/modified ciphertext fails to decrypt
  rather than silently returning garbage).
- **Per-field random IV**: every encrypt operation generates a fresh 96-bit IV —
  IVs are never reused with the same key, which is the critical security property
  GCM depends on.
- **Key derivation**: the master key comes from `VAULT_ENCRYPTION_KEY` via `scrypt`
  (a deliberately slow, memory-hard KDF) rather than being used directly — this
  narrows (but does not eliminate) the blast radius of a weak configured secret.
- **Reveal is the only decrypt path.** List/get responses are built from an explicit
  `VaultItemSummary` shape that structurally cannot include ciphertext or plaintext —
  it's not a matter of remembering to `@Exclude()` a field; the type doesn't have one.

## 8. Future Improvements

- **Zero-knowledge / client-side encryption**: currently the server sees the
  plaintext password briefly (over HTTPS) before encrypting it. A true zero-knowledge
  vault would derive an encryption key from the user's master password client-side
  (e.g. via WebCrypto + a KDF) so the server never has access to plaintext at all —
  a meaningfully stronger (and more complex) design worth prioritizing before this
  module is trusted with real high-value credentials.
- **KMS-backed master key**: replace the env-var-derived key with AWS KMS or
  HashiCorp Vault so the raw key material never sits in application process memory.
- Password strength meter / breach-check (e.g. HaveIBeenPwned k-anonymity API) on
  the create/update form.
- Auto-fill / browser extension integration.
- Shared vault items for the Team Collaboration module (currently strictly
  single-owner).
- Audit log of reveal events (who revealed what, when) for compliance-sensitive
  deployments.

## 9. Testing Strategy

- **Unit**: `EncryptionService` — encrypt→decrypt round trip returns the original
  plaintext; a tampered ciphertext or auth tag throws on decrypt (GCM integrity
  check); two encryptions of the same plaintext produce different ciphertext/IV
  pairs (proves IV randomness).
- **Unit**: `VaultService.toSummary` — asserts the returned shape has no
  ciphertext/IV/authTag keys under any circumstance.
- **Integration/e2e**: create item → list (assert no password field present at all
  in the JSON) → reveal (assert decrypted password matches what was submitted) →
  update password → reveal again (assert it reflects the new value).

## 10. Deployment Notes

- **`VAULT_ENCRYPTION_KEY` is a critical secret** — generate with something like
  `openssl rand -base64 48`, store in a secrets manager (AWS Secrets Manager /
  Parameter Store) in production, and never commit it. Rotating this key requires
  re-encrypting every stored vault item (a migration script, not yet included).
- No new Docker services required for this pass (see Future Improvements for KMS,
  which would add an external dependency).
