# File Manager Module

## 1. Folder Structure

```
apps/backend/src/core/storage/
├── s3-storage.service.ts    # shared S3 presigned-URL wrapper (@Global module)
└── storage.module.ts

apps/backend/src/modules/files/
├── controllers/files.controller.ts
├── services/files.service.ts
├── repositories/files.repository.ts
├── dto/
│   ├── request-upload-url.dto.ts
│   └── confirm-upload.dto.ts
├── entities/file.entity.ts
└── files.module.ts

apps/frontend/src/app/features/files/
├── models/file.model.ts
├── services/files-api.service.ts
├── list/
│   ├── files-list.component.ts
│   ├── files-list.component.html
│   └── files-list.component.scss
└── files.routes.ts
```

## 2. Database Design

Table: `files` (extends shared `BaseEntity`)

| Column | Type | Notes |
|---|---|---|
| owner_id | uuid | indexed |
| original_name | varchar(255) | the user-facing file name |
| storage_key | varchar(1024) | **unique** — the S3 object key; never exposed as a raw public URL |
| mime_type | varchar(100) | validated against an allow-list on upload request |
| size_bytes | bigint | |
| folder_path | varchar(255) | indexed, default `'/'` — simple path-string "folders", not a real tree table |
| is_public | boolean | default false — reserved for future public-share links |

## 3. API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/files?folderPath=` | List files, optional folder filter |
| GET | `/api/files/storage-stats` | Used/quota bytes for the current user |
| POST | `/api/files/upload-url` | **Step 1**: request a presigned S3 PUT URL |
| POST | `/api/files/confirm` | **Step 2**: persist metadata after a successful S3 upload |
| GET | `/api/files/:id/download-url` | Presigned S3 GET URL (5-minute expiry) |
| DELETE | `/api/files/:id` | Deletes the S3 object AND soft-deletes the metadata row |

## 4. Angular Components

- `FilesListComponent` — storage quota bar, upload dropzone (native `<input type="file">`),
  file list with download/delete.
- `FilesApiService.upload()` — orchestrates the full 3-call flow: request presigned
  URL → `PUT` the raw file directly to S3 → confirm metadata.

## 5. UI Flow — Upload (the core design decision of this module)

1. Browser calls `POST /files/upload-url` with the file's name/type/size.
2. Backend validates the MIME type against an allow-list, checks the user's quota,
   mints a unique S3 key, and returns a **presigned PUT URL** (expires in 5 minutes).
3. Browser `PUT`s the raw file bytes **directly to S3** using that URL — the NestJS
   API process never sees the file's bytes, so upload size is not bounded by the
   API server's request body limits or memory.
4. Browser calls `POST /files/confirm` with the storage key + metadata; only now does
   a `files` row get created — a browser crash between steps 3 and 4 leaves an orphan
   S3 object but no dangling metadata (the reverse — a DB row with no S3 object — is
   the more dangerous failure mode we specifically avoid).

## 6. Validation Rules

- `mimeType`: must be in an explicit allow-list (images, PDF, plaintext/CSV, Word,
  Excel) — arbitrary/executable MIME types are rejected outright.
- `sizeBytes`: positive integer, capped at 25MB per file at the DTO level.
- Quota: a 5GB-per-user placeholder tier limit enforced server-side before a presigned
  URL is even issued (`ForbiddenException` if it would be exceeded).

## 7. Business Logic — Secure File Upload

- **Never proxy bytes through the API.** This is the single most important security +
  performance decision in this module: large or malicious payloads never pass through
  application memory; S3 handles the transfer, and the presigned URL's 5-minute expiry
  limits the window an intercepted URL could be reused in.
- **MIME allow-list, not deny-list.** New file types must be explicitly added rather
  than trying to block "known bad" ones — much safer default.
- **Ownership-scoped storage keys** (`users/{ownerId}/{uuid}.{ext}`) mean even if a key
  leaked, it reveals nothing about original filenames and is trivially traceable to an
  owner for auditing.

## 8. Future Improvements

- **Server-side verification via `HeadObjectCommand`**: currently `confirmUpload`
  trusts the client-reported `sizeBytes`/`mimeType` for the metadata row instead of
  re-checking against what S3 actually received. For a stricter quota/security
  guarantee, call `HeadObjectCommand` after the client confirms and reconcile.
- Real folder hierarchy (currently `folderPath` is a flat string field, not a proper
  nested folder entity/tree).
- Public share links (`isPublic` field exists; no share-link generation endpoint yet).
- Image thumbnail generation (Lambda@Edge or a background worker) for the file list UI.
- Virus/malware scanning hook before a file is marked available for download.
- OCR integration for uploaded images/PDFs (AI Assistant module).

## 9. Testing Strategy

- **Unit**: `FilesService.requestUploadUrl` — quota rejection when
  `currentUsage + sizeBytes > quota`; `S3StorageService.buildStorageKey` — correct
  extension extraction for various filename shapes (no extension, multiple dots).
- **Integration/e2e**: full request-url → confirm → list → download-url → delete
  round trip (S3 calls mocked/stubbed in CI — no real AWS credentials required for
  the test suite itself, only the metadata/DB layer is exercised end-to-end).
- **Frontend**: upload progress state transitions, quota-exceeded error message path.

## 10. Deployment Notes

- **Required environment variables** (see root `.env.example`): `AWS_REGION`,
  `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`. In production, prefer
  an IAM role attached to the compute environment (ECS task role / EC2 instance
  profile) over static keys.
- The S3 bucket needs CORS configured to allow `PUT`/`GET` from the frontend's origin
  for the presigned-URL flow to work from the browser.
- No new local Docker service is required — S3 is an external AWS dependency, not
  something run in `docker-compose.yml` (a `localstack` service could be added for
  fully offline local development as a future improvement).
