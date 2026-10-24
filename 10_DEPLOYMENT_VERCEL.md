# 10 - Deployment on Vercel (v2)
**Model:** static Vite build (`dist/`) + serverless functions from `api/`. Every push to `main` deploys; every other branch gets a preview URL. Confirm current plan eligibility and limits on Vercel before relying on them; the app remains useful when the functions are unavailable.

## 1. Repo requirements
`package.json` has `"build": "vite build"` (no `tsc` in it). Functions live in `api/*.ts` and import helpers from `lib/`. Keep `.env` out of git. The deep link `/#app` needs no rewrite rules.

## 2. Steps
1. Push the repo to GitHub.
2. vercel.com -> sign in with GitHub -> **Add New -> Project** -> import the repo.
3. Framework preset **Vite**; build command `npm run build`; output directory `dist`.
4. **Environment Variables:** `GEMINI_API_KEY`, `GEMINI_MODEL` (Production + Preview). Add them before the first deploy or redeploy after adding.
5. Deploy. Open the URL. Test: home page, `#app`, console, `POST /api/advisor` (see 05 section 7).
6. Local test of functions: `npx vercel dev` (needs `vercel login` once).

## 3. Release routine
Merge to `main` -> auto deploy. Do not merge in the last 30 minutes unless it is a verified hotfix. After each deploy run the smoke checklist on two devices (laptop + phone on mobile data). Rollback: Vercel -> Deployments -> pick the last good one -> Promote, or `git revert` and push.

## 4. Troubleshooting
| Symptom | Likely cause | Fix |
|---|---|---|
| Build fails at `vite build` | `tsc` in the build script, or a missing dependency | Make build exactly `vite build`; install the package |
| `/api/*` returns 404 | File not in `api/`, or wrong extension | Check path `api/advisor.ts` |
| `/api/*` returns `{answer:null}` | Env vars missing, wrong model name, or quota used | Set vars, redeploy; the offline advisor still works |
| Function times out or plan limit differs | Gemini slow or platform limit | Keep the 8 s client abort + offline fallback |
| Works locally, not live | `.env` not copied to Vercel | Add Environment Variables, redeploy |
| Blank page, asset 404 | Wrong output directory | Output must be `dist` |

## 5. Pre-submission smoke checklist (live URL)
- [ ] Home loads in under 4 s on mobile data, no console errors
- [ ] **Skip** button works; `/#app` opens the console
- [ ] Start batch -> curves move -> alarms appear
- [ ] Advisor answers online, and also with the key removed (offline)
- [ ] Goal text fills the sliders; invalid AI output is ignored safely
- [ ] `?q=lite` and reduced motion work; phone portrait has no horizontal scroll

## 6. Security
Key only in Vercel env vars; rotate it after the hackathon. Send only simulated numbers and the goal text to Gemini.
