# Decisions log

- 2026-10-13: Build lives in this repo (`jdwr1d/godlike`), branch `claude/env-variables-template-f4hkx7`, PR #1. Existing `index.html` (godlike · Origins) is left untouched; the app will go in its own subfolder at Phase 1.
- 2026-10-13: Phase 0 blocked on network: docs.higgsfield.ai / console.higgsfield.ai unreachable, github.com/higgsfield-ai/app-templates returns 403 through the proxy. No endpoint, model or price has been written from memory.
- Open: BRAND_NAME, APP_SLUG, PRODUCTION_URL, EMAIL_FROM, SUPPORT_EMAIL, CREDIT_MARKUP, PRIMARY_MARKET still unfilled.
- 2026-10-13: Placeholder values chosen by Claude on the owner's request (the prompt's own examples). All are changeable and none is verified:
  BRAND_NAME=Fachada · APP_SLUG=fachada-studio · PRODUCTION_URL=https://fachada.studio · EMAIL_FROM="Fachada <login@fachada.studio>" · SUPPORT_EMAIL=soporte@fachada.studio · CREDIT_MARKUP=2.5 · PRIMARY_MARKET="Costa Rica + LATAM" · DEFAULT_LOCALE=es.
  Not checked: domain availability/ownership, Resend domain verification, trademark. Verify before launch.
- 2026-10-13: Phase 1 scaffold started WITHOUT the Higgsfield `app-templates` registry (unreachable). Plain `create-next-app` (Next 16.4, React 19, Tailwind v4, TS strict) in `fachada-studio/`. Template UI (Quanta tokens, shadcn components, generation/*) must be merged in once the host is reachable.
- 2026-10-13: Disabled `cacheComponents`/`partialPrefetching` (create-next-app defaults) because locale is read from the NEXT_LOCALE cookie in the root layout, which is dynamic. Revisit if the template requires them.
- 2026-10-13: i18n = next-intl with cookie locale (no URL prefix), es default.
- 2026-10-13: Phase 2 code written (Auth.js v5 beta.32 + Mongo adapter + Resend magic link, bilingual React Email, personal workspace on first sign-in, membership/role helper, invite create/accept lib, Mongo rate limiter, proxy.ts cookie redirect). NextAuth uses the lazy-config form so `next build` works without MONGODB_URI. Typecheck/lint/build pass. NOT verified against a real Mongo/Resend (no credentials): magic-link sign-in, invites and rate limiting are untested at runtime.
- Phase 2 still missing: onboarding form (company name/type/country/logo), invite email + UI, accept-invite route, workspace switcher, members page, disposable-domain block, tests.
