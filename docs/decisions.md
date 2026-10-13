# Decisions log

- 2026-10-13: Build lives in this repo (`jdwr1d/godlike`), branch `claude/env-variables-template-f4hkx7`, PR #1. Existing `index.html` (godlike · Origins) is left untouched; the app will go in its own subfolder at Phase 1.
- 2026-10-13: Phase 0 blocked on network: docs.higgsfield.ai / console.higgsfield.ai unreachable, github.com/higgsfield-ai/app-templates returns 403 through the proxy. No endpoint, model or price has been written from memory.
- Open: BRAND_NAME, APP_SLUG, PRODUCTION_URL, EMAIL_FROM, SUPPORT_EMAIL, CREDIT_MARKUP, PRIMARY_MARKET still unfilled.
- 2026-10-13: Placeholder values chosen by Claude on the owner's request (the prompt's own examples). All are changeable and none is verified:
  BRAND_NAME=Fachada · APP_SLUG=fachada-studio · PRODUCTION_URL=https://fachada.studio · EMAIL_FROM="Fachada <login@fachada.studio>" · SUPPORT_EMAIL=soporte@fachada.studio · CREDIT_MARKUP=2.5 · PRIMARY_MARKET="Costa Rica + LATAM" · DEFAULT_LOCALE=es.
  Not checked: domain availability/ownership, Resend domain verification, trademark. Verify before launch.
