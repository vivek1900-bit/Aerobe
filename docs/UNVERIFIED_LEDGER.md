# Verification ledger (v2)

## Count

| Stage | Count |
|---|---:|
| Original v1 verification markers | 26 |
| Remaining legacy verification markers in this v2 blueprint | 0 |

## Resolutions and safe fallbacks

| Area | Resolution / safe fallback |
|---|---|
| Gemini API key and quota | Gemini is an optional demo enhancement. Availability and limits must never block submission: a missing key, quota, or function always uses the offline advisor. |
| Gemini model and REST shape | `GEMINI_MODEL` stays an environment variable. Malformed or unavailable API responses return `null` and trigger the offline fallback; the deterministic planner preset remains available. |
| Vercel availability and function duration | Use the configured Vercel plan’s current limits. The client aborts at 8 s and remains usable without the function. |
| Fonts and optional 3D packages | Install only when the package resolves in the actual project. Font system fallback is permitted; optional 3D work is skipped if package compatibility is not confirmed. |
| Scientific model | All values are labelled illustrative. The unchanged equations are accepted only against the local reference calibration and tests; the app makes no real-process validation claim. |

No old platform-specific commands, reviewer claims, or stale file references are retained as active instructions.
