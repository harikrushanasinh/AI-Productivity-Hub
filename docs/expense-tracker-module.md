# Expense Tracker Module

## 1. Folder Structure

```
apps/backend/src/modules/expenses/
├── controllers/expenses.controller.ts
├── services/expenses.service.ts
├── repositories/expenses.repository.ts
├── dto/
│   ├── create-expense.dto.ts
│   ├── update-expense.dto.ts
│   └── query-expenses.dto.ts
├── entities/expense.entity.ts
└── expenses.module.ts

apps/frontend/src/app/features/expenses/
├── models/expense.model.ts
├── services/expenses-api.service.ts
├── list/
│   ├── expenses-list.component.ts
│   ├── expenses-list.component.html
│   └── expenses-list.component.scss
└── expenses.routes.ts
```

## 2. Database Design

Table: `expenses` (extends shared `BaseEntity`)

| Column | Type | Notes |
|---|---|---|
| owner_id | uuid | indexed |
| title | varchar(255) | required |
| amount_minor | bigint | **money stored as integer minor units (cents)** — never float/numeric for currency math |
| currency | varchar(3) | ISO 4217 code, default `USD` |
| type | enum(expense, income) | default `expense` |
| category | enum(food, transport, housing, utilities, entertainment, health, shopping, education, travel, income, other) | indexed |
| spent_on | date | indexed — the transaction date, not the row creation date |
| notes | text | nullable |
| receipt_url | varchar | nullable — S3 object URL for a scanned receipt (OCR future improvement) |

## 3. API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/expenses?from=&to=&category=&type=&page=&limit=` | Paginated, filterable list |
| GET | `/api/expenses/summary?from=&to=` | Income vs expense totals + net for a range |
| GET | `/api/expenses/:id` | Get one record |
| POST | `/api/expenses` | Create an expense or income record |
| PATCH | `/api/expenses/:id` | Update a record |
| DELETE | `/api/expenses/:id` | Soft-delete |

**Route ordering note:** `GET /summary` is declared before `GET /:id` in the controller —
Nest matches routes in declaration order, so this prevents `"summary"` from being
swallowed by the `:id` param.

## 4. Angular Components

- `ExpensesListComponent` — summary cards (income/expense/net), quick-add form (title,
  amount in dollars — converted to cents client-side, date, expense/income toggle),
  transaction list with category chips.
- `ExpensesApiService` — HTTP wrapper; `Intl.NumberFormat` used for currency display
  (never hand-rolled string formatting for money).

## 5. UI Flow

1. User opens `/expenses`.
2. Summary row shows income, expenses, and net for all recorded data (extendable to a
   date-range picker).
3. Quick-add form: amount is entered in normal decimal dollars in the UI and converted
   to integer cents (`Math.round(amount * 100)`) before hitting the API — the API only
   ever accepts/returns integers to keep the money model exact.
4. Transaction list below, newest first, with a category tag and colored amount
   (green for income, red for expense).

## 6. Validation Rules

- `amountMinor`: required, positive integer (rejects `0`, negative, and non-integer values).
- `currency`: exactly 3 characters if provided (ISO 4217 shape check; not validated
  against a currency table in this pass).
- `spentOn`: required ISO date string.
- `title`: required, max 255 chars.
- Global `ValidationPipe` strips/rejects unknown fields.

## 7. Business Logic

- All money math happens in integer minor units end-to-end — the database, the DTOs,
  and the service layer never touch a float for a monetary value. Only the Angular
  display layer converts to/from decimal, and only for rendering/input, never for
  storage or calculation.
- `summary()` aggregates via a SQL `SUM(...) GROUP BY type` query rather than pulling
  all rows into memory — this scales correctly as expense history grows.
- Ownership scoping identical to other modules (`WHERE ownerId = :ownerId`).

## 8. Future Improvements

- Multi-currency support with real exchange-rate conversion for the summary (currently
  `summary()` assumes a single currency; mixed currencies would need normalization).
- Receipt OCR: upload a photo → AI OCR feature extracts title/amount/date automatically
  (`receiptUrl` field already reserved for the uploaded image).
- Budgets per category with overspend alerts (ties into the Notifications module).
- Recurring expenses (subscriptions) similar to Calendar's recurrence concept.
- Charts (spend by category pie chart, spend-over-time line chart) once the Analytics
  module exists.

## 9. Testing Strategy

- **Unit**: `ExpensesService` — summary aggregation math, rejection of non-positive
  amounts, default category/type application.
- **Integration/e2e**: create an income and an expense record → fetch summary → assert
  `net = income - expense` → soft-delete → confirm it's excluded from subsequent summary.
- **Frontend**: dollar-to-cents conversion correctness (e.g. `19.99` → `1999`, not
  `1998` or `2000` due to floating-point drift — verified with `Math.round`).

## 10. Deployment Notes

- No new environment variables required.
- `receipt_url` (Future Improvement: OCR) will require the AWS S3 bucket already
  referenced in the root `.env.example` (`AWS_S3_BUCKET`, `AWS_REGION`, credentials).
- No new Docker services required.
