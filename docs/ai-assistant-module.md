# AI Assistant Module

## 1. Folder Structure

```
apps/backend/src/core/ai/
├── ai-provider.service.ts    # thin Anthropic SDK wrapper (@Global module)
└── ai-provider.module.ts

apps/backend/src/modules/ai/
├── controllers/ai.controller.ts
├── services/ai.service.ts
├── repositories/ai.repository.ts
├── dto/
│   ├── chat-message.dto.ts
│   ├── rewrite-text.dto.ts
│   ├── write-email.dto.ts
│   ├── summarize-meeting.dto.ts
│   ├── generate-code.dto.ts
│   ├── daily-planner.dto.ts
│   └── ocr-image.dto.ts
├── entities/
│   ├── ai-conversation.entity.ts
│   └── ai-message.entity.ts
└── ai.module.ts

apps/frontend/src/app/features/ai/
├── models/ai.model.ts
├── services/ai-api.service.ts
├── assistant/
│   ├── ai-assistant.component.ts   # tabbed multi-tool interface
│   ├── ai-assistant.component.html
│   └── ai-assistant.component.scss
└── ai.routes.ts
```

## 2. Database Design

Only **AI Chat** persists anything — every other tool (Rewrite, Email Writer,
Meeting Summary, Code Generator, OCR) is stateless request/response.

**`ai_conversations`** (extends shared `BaseEntity`)

| Column | Type | Notes |
|---|---|---|
| owner_id | uuid | indexed |
| title | varchar(255) | auto-set from the first message's first 60 chars |

**`ai_messages`**

| Column | Type | Notes |
|---|---|---|
| conversation_id | uuid | indexed |
| role | enum(user, assistant) | |
| content | text | |

## 3. API Endpoints

| Method | Path | Feature |
|---|---|---|
| GET | `/api/ai/chat/conversations` | List conversations |
| GET | `/api/ai/chat/conversations/:id/messages` | Get a conversation's messages |
| POST | `/api/ai/chat` | **AI Chat** — send a message, get a reply |
| POST | `/api/ai/rewrite` | **Text Rewrite** — tone-shift a piece of text |
| POST | `/api/ai/email-writer` | **Email Writer** — draft an email from intent |
| POST | `/api/ai/meeting-summary` | **Meeting Summary** — transcript → decisions + action items |
| POST | `/api/ai/code-generator` | **Code Generator** — prompt → code snippet |
| POST | `/api/ai/daily-planner` | **Daily Planner** — real Tasks + Calendar data → a time-blocked plan |
| POST | `/api/ai/smart-reminder` | **Smart Reminder** — suggests a reminder timing for a task |
| POST | `/api/ai/ocr` | **OCR** — vision-based text extraction from an image |
| GET | `/api/ai/smart-search?q=` | **Smart Search** — one query across Notes, Tasks, Bookmarks |

All AI endpoints share an independent, tighter rate limit
(`@Throttle`: 20 requests/60s per user) on top of the app's global throttle, since AI
calls are slower and cost real money per request.

**Voice Assistant** is not a backend endpoint — see Future Improvements.

## 4. Angular Components

- `AiAssistantComponent` — a single tabbed page (Chat / Rewrite / Email Writer /
  Meeting Summary / Code Generator / Daily Planner), each tab a lightweight
  form-in, result-out panel sharing the same glass-panel visual language as the
  rest of the app.
- `AiApiService` — one method per feature endpoint.

## 5. UI Flow

1. User picks a tool tab. Chat keeps a running message list (and remembers the
   active `conversationId` across turns); every other tool is single-shot.
2. Submitting shows a loading state, then renders the result in a shared
   `.result-box` style (or a `<pre>` block for code).
3. If `ANTHROPIC_API_KEY` isn't configured server-side, every tool surfaces the
   same friendly error (`handleError()`) rather than a raw 503 — the app doesn't
   crash or block, it just tells the user AI isn't set up yet.

## 6. Validation Rules

- All free-text inputs are length-capped at the DTO level (e.g. chat messages
  ≤8000 chars, transcripts ≤20000 chars, code prompts ≤2000 chars) — generous
  enough for real use, but bounded so a single request can't balloon token cost
  unpredictably.
- `tone` fields (Rewrite) are a fixed enum (`professional`, `friendly`, `concise`,
  `persuasive`) rather than free text, so prompts stay predictable.

## 7. Business Logic

- **One provider wrapper, many features.** `AiProviderService` (in `core/ai/`,
  not the `ai` feature module) is the *only* class that imports the Anthropic SDK.
  Every feature service builds a system prompt + message list and calls
  `.complete()` or `.completeWithImage()` — swapping models, adding retry/backoff,
  or adding token-usage logging happens in exactly one file.
- **Graceful degradation, not a hard boot failure.** Unlike `VAULT_ENCRYPTION_KEY`
  (which blocks the whole app from starting if missing), a missing
  `ANTHROPIC_API_KEY` only fails AI-specific requests, with a clear
  `ServiceUnavailableException` message — the rest of the platform (Tasks, Notes,
  Calendar, etc.) works completely fine without AI configured. This reflects AI
  being an enhancement layer, not a dependency of the core product.
- **Daily Planner and Smart Search compose real data**, not a description of it —
  `AiService` injects `TasksService`, `CalendarService`, `NotesService`, and
  `BookmarksService` and calls their actual public methods (same Clean
  Architecture pattern as the Analytics module) rather than asking the user to
  paste their schedule into a chat box.
- **Chat history is per-conversation and append-only**: every user turn is saved
  immediately (before the AI call), so even if the Anthropic API call fails, the
  user's message isn't lost — only the assistant's reply is missing, and they can
  retry.

## 8. Future Improvements

- **Voice Assistant**: no backend endpoint exists yet. The natural implementation
  is client-side Web Speech API (`SpeechRecognition`) transcribing to text in the
  browser, then sending that text through the existing `/ai/chat` endpoint — no
  new backend work needed, just a frontend microphone button wired to the chat tab.
- **Smart Search AI re-ranking**: currently a straightforward per-module keyword
  filter (no AI call at all in the search path itself, despite the name) — a
  genuine improvement would have the AI re-rank/deduplicate/summarize the combined
  results, or expand the query with synonyms before searching.
- **Smart Notes**: the original spec's "Smart Notes" (AI-assisted note-taking,
  auto-tagging, auto-summarizing) isn't a distinct endpoint yet — the closest
  existing hook is the unused `aiSummary` column already sitting on the `Note`
  entity from the Notes module; wiring a "summarize this note" button to a new
  `/ai/summarize-note/:id` endpoint (reusing the meeting-summary prompt pattern)
  is the natural next step.
- **Streaming responses**: chat and long-form tools (meeting summary, code
  generator) currently wait for the full response before returning — streaming
  via Server-Sent Events or the Anthropic SDK's streaming mode would make the UI
  feel much faster for longer outputs.
- **Conversation deletion/rename** endpoints (currently conversations can be
  listed and appended to, but not renamed or deleted).
- **Token/cost usage tracking** per user, surfaced in Analytics.

## 9. Testing Strategy

- **Unit**: `AiService` — mock `AiProviderService` entirely (no real API calls in
  tests); assert each feature method builds the expected system prompt/message
  shape and returns `{ result }`; assert `chat()` persists the user message even
  when the mocked provider throws.
- **Unit**: `AiProviderService` — asserts it throws `ServiceUnavailableException`
  cleanly when no API key is configured, rather than throwing an unhandled SDK error.
- **Integration/e2e**: with `ANTHROPIC_API_KEY` unset in the test environment,
  hit each AI endpoint and assert a `503` with the expected message — this
  exercises the graceful-degradation path without requiring real API credentials
  or spending money in CI.

## 10. Deployment Notes

- **`ANTHROPIC_API_KEY`** (see root `.env.example`) — required for AI features to
  function; the app boots and everything else works without it.
- No new Docker services required.
- **Cost control in production**: the per-user AI throttle (20 req/min) is a
  starting point, not a finished cost-control story — consider a per-user daily
  token budget once usage patterns are known, tracked via the Future Improvements
  "token/cost usage tracking" item.
