# Security Watchdog Report — 2026-10-05

## Summary

One **critical** CVE found in `admin/` (Next.js — remote code execution class). Ten **high** CVEs
in the root app (brace-expansion DoS cluster, vite, postcss, and others). Two long-standing
security backlog items remain open: `handle_dispatch_response` still lacks an `auth.uid()` ownership
check, and `generate_weekly_report` is callable by any authenticated user (not admin-only).
`search_professionals` still returns `phone` to `anon` callers; migration 043 acknowledges this but
has not shipped a fix. `push-notify` JWT validation and `create-payment-intent` client-identity
enforcement are **fixed**. No secrets found in source files. No new edge functions or migrations
were merged this week.

---

## Critical — Block Ship

### CVE: `next` (admin/) — CRITICAL, fix available
- **Package:** `next` in `admin/`
- **Fix:** `npm audit fix` inside `admin/` (or pin to latest Next.js stable)
- Next.js has had multiple high/critical CVEs in 2026 (server-action SSRF, cache poisoning, auth
  bypass). The exact advisory is flagged by `npm audit` as critical with a fix available.
- **Action required:** upgrade immediately; admin panel is a higher-value target than the user-facing
  app.

---

## High

### 1. `handle_dispatch_response` — STILL OPEN
- **Location:** `supabase/migrations/010_apply_missing.sql:521`
- The function is `SECURITY DEFINER` and accepts any `p_dispatch_id` from any authenticated user.
  It does **not** check `auth.uid() = v_dispatch.professional_id`. Any authenticated user who knows
  (or brute-forces) a dispatch UUID can accept or decline another professional's job offer, causing
  incorrect service_request assignment and polluting professional metrics.
- **Fix:** add `IF auth.uid() != v_dispatch.professional_id THEN RAISE EXCEPTION 'Forbidden';` after
  the initial SELECT.

### 2. `generate_weekly_report` — STILL OPEN
- **Location:** `supabase/migrations/041_weekly_admin_report.sql:228`
- `GRANT EXECUTE … TO authenticated` with no admin-role guard inside the function body. Any logged-in
  user can call it and read aggregated business metrics (volume by city/category, revenue, supply
  health).
- **Fix:** add `IF NOT has_role('admin'::app_role, auth.uid()) THEN RAISE EXCEPTION 'Forbidden'; END IF;`
  as the first statement in the function body.

### 3. Root npm HIGH CVEs (10 issues, all fixes available)
| Package | Advisory summary |
|---|---|
| `brace-expansion` ≤1.1.20 | DoS via exponential/recursive expansion (5 CVEs) |
| `vite` | Multiple HIGH advisories; fix: `vite@8.3.2` |
| `postcss` | ReDoS in selector parsing |
| `browserslist` | ReDoS |
| `fast-glob` | ReDoS via crafted glob |
| `fast-uri` | URI parsing flaw |
| `nanoid` | Infinite loop with negative size |
| `ws` | DoS via frame masking |
| `lovable-tagger` | HIGH; fix: `lovable-tagger@1.0.20` |
| `@tailwindcss/typography` | Via tailwindcss; fix: `@tailwindcss/typography@0.4.1` |

Run `npm audit fix` in repo root; review major-bump packages (`@tailwindcss/typography`) manually.

---

## Medium

### 1. `search_professionals` exposes `phone` to `anon` — STILL OPEN
- **Location:** `supabase/migrations/027_fixr_search_ranking.sql:92,176,197`
- Both `search_professionals` and `top_professionals` select `p.phone` and are granted to `anon`.
  Migration 043 (`043_rls_hardening_audit.sql`) acknowledges this with a comment but no fix has
  shipped.
- **Fix:** remove `phone` from the return columns of the anon-accessible RPCs; surface it only after
  a booking is confirmed.

### 2. `create-payment-intent` — amount_cents still from request body (PARTIAL FIX)
- **Location:** `supabase/functions/create-payment-intent/index.ts:69-70`
- JWT validation and client_id ownership check are now in place (FIXED). However `amount_cents` is
  still taken directly from the request body. A malicious client can send an arbitrarily low value.
  Server-side derivation from the agreed service price in the DB is the correct fix.
- **Action:** look up `amount_cents` from `service_requests` or a canonical price table instead of
  trusting the caller.

### 3. admin/ HIGH CVEs (3 additional issues)
| Package | Severity | Fix |
|---|---|---|
| `nanoid` | HIGH | `npm audit fix` in `admin/` |
| `postcss` | HIGH | `npm audit fix` in `admin/` |
| `ws` | HIGH | `npm audit fix` in `admin/` |
| `sharp` | HIGH | `npm audit fix` in `admin/` |

---

## Low

- **`@supabase/auth-js` (admin/):** LOW — insecure path routing from malformed user input.
  Fix: upgrade `@supabase/supabase-js` to `2.117.2` in `admin/`.

---

## No-op — Checked, Came Back Clean

- **Secrets scan:** `grep` over all `.ts/.tsx/.js/.jsx/.sql/.env/.json/.md` for Supabase secret keys,
  live Stripe keys, JWTs, and private key headers — **nothing found**. Service-role key is referenced
  only via `process.env.SUPABASE_SERVICE_ROLE_KEY` (env var, not hardcoded).
- **`push-notify` JWT validation:** **FIXED** — `index.ts:117–132` now validates the Bearer token
  and rejects unauthenticated callers.
- **New edge functions / RPCs this week:** `git log --since='7 days ago'` against
  `supabase/functions/**` and `supabase/migrations/**` returned **no commits**. Nothing new to
  surface for manual review.
- **Outdated majors:** `npm outdated` returned `current: null` for all packages (node_modules not
  installed in CI clone). Could not assess major version gaps this run.
