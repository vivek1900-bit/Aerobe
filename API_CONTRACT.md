# AEROBE API Contract

Serverless backend on Vercel. No separate application server exists; all backend logic is in `api/` serverless functions. The simulation runs entirely in the browser.

## Base URL

- Local development: `http://localhost:3000` (via `vercel dev` or Vite dev server proxy)
- Production: deployed Vercel URL (same origin as the frontend)

## Shared Constraints

| Rule | Value |
|------|-------|
| HTTP method | POST only (all other methods return 405) |
| Success status | Always 200, even on failure (null fallback) |
| Failure payload | `{ answer: null }` or `{ plan: null }` — never throws |
| Content-Type request | `application/json` |
| Content-Type response | `application/json` |
| Timeout | 8 s internal abort (AbortController); Vercel function max 10 s |
| Auth | `x-goog-api-key` header sent internally from `process.env.GEMINI_API_KEY` — never exposed to client |
| Secrets | Never logged; keys and prompts never included in responses |

---

## 1. POST /api/advisor

Process advisor: asks the simulated bioreactor process advisor a question grounded in a snapshot.

### Route

```
POST /api/advisor
```

### Headers

| Header | Value | Required |
|--------|-------|----------|
| Content-Type | application/json | Yes |

### Request Schema

```ts
type AdvisorRequest = {
  /** User question about the simulated run. Max 300 chars. Must be non-empty. */
  question: string;
  /** Organism identifier. One of: "ecoli", "yeast". Max 50 chars. Non-empty. */
  organism: string;
  /** Latest simulation snapshot. All values must be finite numbers or null. */
  snapshot: Record<string, unknown>;
  /** Recent conversation history. Array, max 12 entries. */
  recent: unknown[];
};
```

### Validation Rules

| Field | Rule | Failure behavior |
|-------|------|------------------|
| `question` | Non-empty string, length ≤ 300 | Return `{ answer: null }`, HTTP 200 |
| `organism` | Non-empty string, length ≤ 50 | Return `{ answer: null }`, HTTP 200 |
| `snapshot` | Plain object; every value must be finite number or null | Return `{ answer: null }`, HTTP 200 |
| `recent` | Array, length ≤ 12 | Return `{ answer: null }`, HTTP 200 |
| Body missing / invalid JSON | Any parse error | Return `{ answer: null }`, HTTP 200 |

### Response Schema

```ts
type AdvisorResponse = {
  /** Advisory answer string, or null on any failure (quota, no key, invalid input, timeout). */
  answer: string | null;
};
```

### Example Request

```json
{
  "question": "Why did DO drop after hour 6?",
  "organism": "ecoli",
  "snapshot": { "t_h": 6.5, "X": 3.2, "S": 2.1, "DO": 37, "pH": 6.97, "T": 37, "V": 2.0 },
  "recent": []
}
```

### Example Response (Success)

```json
{
  "answer": "Carbon substrate is depleting, reducing oxygen uptake. Consider reducing agitation or preparing a feed pulse."
}
```

### Example Response (Failure)

```json
{
  "answer": null
}
```

---

## 2. POST /api/plan

Goal-to-sliders planner: converts a natural-language goal into bounded control slider values.

### Route

```
POST /api/plan
```

### Headers

| Header | Value | Required |
|--------|-------|----------|
| Content-Type | application/json | Yes |

### Request Schema

```ts
type PlanRequest = {
  /** User goal description. Max 200 chars. Must be non-empty. */
  goal: string;
  /** Organism identifier. One of: "ecoli", "yeast". Max 50 chars. Non-empty. */
  organism: string;
};
```

### Validation Rules

| Field | Rule | Failure behavior |
|-------|------|------------------|
| `goal` | Non-empty string, length ≤ 200 | Return `{ plan: null }`, HTTP 200 |
| `organism` | Non-empty string, length ≤ 50 | Return `{ plan: null }`, HTTP 200 |
| Body missing / invalid JSON | Any parse error | Return `{ plan: null }`, HTTP 200 |

### Response Schema

```ts
type PlanResponse = {
  /** Control plan object, or null on any failure (invalid JSON, missing keys, no key, timeout). */
  plan: Plan | null;
};

type Plan = {
  Tset: number;       // clamped to [20, 45]
  pHset: number;      // clamped to [5, 8.5]
  rpm: number;        // clamped to [100, 1000]
  vvm: number;        // clamped to [0.1, 2.0]
  feed: number;       // clamped to [0, 50]
  reason?: string;    // truncated to 200 chars
};
```

### Server-Side Clamping (§6 Control Ranges)

| Control | Min | Max | Step | Default (E. coli) | Default (Yeast) |
|---------|-----|-----|------|-------------------|-----------------|
| `Tset` (°C) | 20 | 45 | 0.5 | 37 | 30 |
| `pHset` | 5.0 | 8.5 | 0.1 | 7.0 | 5.0 |
| `rpm` | 100 | 1000 | 10 | 400 | 300 |
| `vvm` | 0.1 | 2.0 | 0.1 | 1.0 | 0.8 |
| `feed` (mL/h) | 0 | 50 | 1 | 0 | 0 |

Clamping behavior: only known keys (`Tset`, `pHset`, `rpm`, `vvm`, `feed`) are kept; values are coerced to numbers and clamped to `[min, max]`. Unknown keys are dropped. If no known keys remain after clamping, the response is `{ plan: null }`. `reason` is truncated to 200 characters if present.

### Example Request

```json
{
  "goal": "maximize biomass production",
  "organism": "ecoli"
}
```

### Example Response (Success)

```json
{
  "plan": {
    "Tset": 37,
    "pHset": 7.0,
    "rpm": 400,
    "vvm": 1.0,
    "feed": 0,
    "reason": "Default aerobic batch settings for E. coli on glucose."
  }
}
```

### Example Response (Failure)

```json
{
  "plan": null
}
```

---

## 3. Frontend Integration Notes

- Both endpoints always return HTTP 200. Check the `answer` / `plan` field for `null` to detect fallback conditions.
- On `null`, the frontend should use the offline rules advisor / deterministic organism preset per 03 §2.
- Client-side: enforce a 3 s cooldown between advisor calls and an 8 s request abort to match backend behavior.
- Never send the `GEMINI_API_KEY` from the client; it is server-side only.
- String inputs are trimmed server-side; frontend should also trim before sending.
- `recent` array is capped at 12 entries server-side; older entries are ignored.

---

## 4. Status Code Summary

| Condition | Status | Body |
|-----------|--------|------|
| Valid POST, success | 200 | `{ answer: string }` or `{ plan: object }` |
| Valid POST, failure / fallback | 200 | `{ answer: null }` or `{ plan: null }` |
| Invalid JSON body | 200 | `{ answer: null }` or `{ plan: null }` |
| Missing / invalid fields | 200 | `{ answer: null }` or `{ plan: null }` |
| GET / PUT / DELETE / PATCH | 405 | `{ error: "Method Not Allowed" }` |
| Gemini timeout / quota / no key | 200 | `{ answer: null }` or `{ plan: null }` |
