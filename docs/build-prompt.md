# Build prompt: AI content studio for real estate & construction (on the Higgsfield API)

> Fill in the `{{PLACEHOLDERS}}`, then paste this whole document into Claude Code (or another coding agent) from an empty folder.

```
BRAND_NAME        = {{BRAND_NAME}}          # e.g. "Fachada" — NOT "Higgsfield"
APP_SLUG          = {{APP_SLUG}}            # e.g. "fachada-studio"
PRODUCTION_URL    = {{PRODUCTION_URL}}      # e.g. https://fachada.studio
EMAIL_FROM        = {{EMAIL_FROM}}          # e.g. "Fachada <login@fachada.studio>" (domain verified in Resend)
SUPPORT_EMAIL     = {{SUPPORT_EMAIL}}
CREDIT_MARKUP     = {{CREDIT_MARKUP}}       # e.g. 2.5 = sell at 2.5x the Higgsfield API cost
PRIMARY_MARKET    = {{PRIMARY_MARKET}}      # e.g. "Costa Rica + LATAM"
DEFAULT_LOCALE    = es                      # UI default; English available
```

---

## 0. Your role and the mission

You are a senior full-stack engineer. Build **{{BRAND_NAME}}**, a vertical AI content studio for **real estate agencies, brokers, developers (desarrolladoras) and construction companies**. Users upload property photos, renders, floor plans and site footage, and turn them into listing-ready images, walkthrough videos, social reels, voiceovers, ad creatives and listing copy — all generated through the **Higgsfield API**, organized by **property/project**, branded with the company's **brand kit**, and paid for with **credits via Stripe**.

The generator UX borrows from higgsfield.ai (prompt dock, model card, settings pills, justified feed, lightbox, dark UI with a lime accent). The **information architecture is built around properties and use cases, not models.** A broker should never need to know what "Flux Kontext" is.

It must not be an unfinished demo. Every visible control works from start to finish.

### Product principles (apply to every decision)

1. **Use case first, model second.** Users pick a **Tool** ("Amueblado virtual", "Día a atardecer", "Recorrido en video"). Each Tool maps to a verified default model, a prompt template, locked/visible settings and input slots. An "Avanzado" toggle exposes the full model picker for power users.
2. **The Property is the unit of work.** Every upload, generation, reel, copy and export belongs to a Property (a listing or a construction project) inside a Workspace.
3. **On-brand by default.** Outputs can carry the workspace brand kit (logo, colors, fonts, contact, watermark) and export in social/portal formats.
4. **Honest marketing.** Real estate content that alters reality (virtual staging, sky/lawn replacement, AI aerials, lifestyle scenes in renders) is labeled by default. Architecture is never altered by staging tools. See §9.
5. **Spanish first.** UI, emails, Tool names, copy output and errors default to neutral Latin American Spanish (formal "usted" in UI copy; record the choice). English is a full second locale.

### Stack (locked, do not substitute)

| Concern | Choice |
|---|---|
| Framework | **Next.js** (App Router, version pinned by the Higgsfield template, currently 16.x), React 19, TypeScript strict |
| Styling/UI | Tailwind v4 + shadcn (Base UI primitives), `lucide-react`, zustand, `@tanstack/react-virtual` (from the Higgsfield template) |
| i18n | `next-intl` (es default, en) |
| Auth | **NextAuth / Auth.js v5** with **magic links only** |
| Email | **Resend** + React Email (magic links, invites, receipts, "your reel is ready") |
| Database | **MongoDB Atlas** via the official `mongodb` driver (shared with the Auth.js adapter) |
| Payments | **Stripe** (Checkout, Subscriptions with seats, Customer Portal, webhooks) |
| Generation | **Higgsfield API** (one server-side key) |
| Media storage | **Cloudflare R2** (Higgsfield keeps outputs only ≥7 days) |
| Composition | **ffmpeg** (`ffmpeg-static`) + **sharp** for reels, overlays, before/after, exports — in a worker (see §8) |
| Copywriting (optional module) | **Anthropic API** (Claude) for listing descriptions and captions |

### How to work

1. Work in the **phases** in §14. At the end of each phase, stop and report: what works, what you verified and how, what's next. Continue only after I reply, unless I've told you to run straight through.
2. **Never invent a Higgsfield endpoint path, parameter name or enum value.** Every model comes from the Higgsfield docs, the console model list or the template's model files, with a source-URL comment. Unverifiable models go in `docs/model-catalog.md` under "Unverified" and stay out of the UI.
3. Docs vs template conflict: **live docs win** for API behavior, **template wins** for UI/component patterns. Log it in `docs/decisions.md`.
4. Ask me only about brand assets, final prices, legal copy, and the test photo set (§4). Everything else: pick a sensible default, log it in `docs/decisions.md`, keep going.
5. Strict TypeScript. No `any`, `@ts-ignore`, `@ts-expect-error`. `pnpm typecheck`, `pnpm lint`, `pnpm build` pass at the end of every phase.

---

## 1. Ground-truth sources (read before writing code)

### 1a. GitHub: `github.com/higgsfield-ai` (clone into `./_reference/`, gitignored)

| Repo | What you take from it |
|---|---|
| **`higgsfield-ai/app-templates`** ★ (Studio template) | **Your scaffold.** UI components, Quanta tokens (`styles/quanta/*`), `generation/platform.ts`, `generation/poll.ts`, `generation/upload*.ts` + `app/api/upload/route.ts`, `generation/catalog/**`, `lib/studio/use-runs.ts`. Read `AGENTS.md`, `layouts/AGENTS.md`, `components/studio/AGENTS.md` in full. |
| `higgsfield-ai/higgsfield-js` (MIT) | Auth header, status lifecycle, `hf_webhook`, retries. Use the v2 SDK server-side or keep the template's `fetch` client — pick one, log it. |
| `higgsfield-ai/higgsfield-client` (Apache-2.0) | Cross-check request/upload/retry semantics only |
| `higgsfield-ai/cli` → `MODELS.md` | Which models exist + parameter ranges. ⚠ CLI names are job-set types, **not** REST paths. |
| `higgsfield-ai/skills` → `higgsfield-generate/references/model-catalog.md`, `prompt-engineering.md`, `media-inputs.md` | Which model is best for what; prompt guidance for Tool templates |
| `higgsfield-ai/higgsfield` | **Ignore** (GPU training framework) |

```bash
pnpm dlx shadcn@latest init -t next -n {{APP_SLUG}} --no-monorepo -y higgsfield-ai/app-templates/studio
git clone https://github.com/higgsfield-ai/app-templates _reference/app-templates
```

> License note: as of 2026-09-26 `app-templates` has **no LICENSE file**. It's published as a public shadcn registry for building on the Higgsfield API, which is what we're doing. Keep attribution comments, re-check before launch, log it.

### 1b. Higgsfield API docs: `https://docs.higgsfield.ai`

Start with **`/docs/llms.txt`**. Read: quickstart, authentication, how-to/introduction, concepts (requests, polling, file-uploads, errors, rate-limits, billing-and-retention), how-to/webhooks, api-reference (overview, get-request-status, cancel-a-queued-request), `/docs/models.md` and **every model page**, `/docs/openapi.json`.
**`https://console.higgsfield.ai`** is the source of truth for model discovery and the **per-model USD price list**. Ask me for a copy if you can't reach it.

### 1c. UX references (look, don't copy brand)

- **higgsfield.ai** generator pages (`/ai/image`, `/ai/video`, `/audio`), effects gallery, pricing page: for the generator panel, model card, settings pills, feed and lightbox patterns. Screenshot at 1440px and 390px. Decline cookie banners, submit nothing.
- Vertical patterns to study (layout only): virtual-staging tools' before/after sliders, real estate listing portals' photo galleries, Canva/CapCut-style simple reel composers.

**Output:** `docs/ui-inventory.md` (pages, components, states: empty, loading, generating, failed, content-filtered, success; modals; responsive behavior) + `docs/screens/`.

### 1d. Brand rules

Use the generator UX patterns. **Never** use the Higgsfield name, logo, marketing media or copy. Use {{BRAND_NAME}}, my logo (ask me, or a placeholder wordmark) and our own Spanish-first copy. Provider icons next to model names (Advanced mode only) are fine. **Never use photos scraped from listing portals** — demo media comes from the test set I provide or licensed stock (log the license).

---

## 2. Target architecture

```
Browser
  │  Tool panel, property picker, uploads (PUT to signed URL), feed, reel composer
  │  polls GET /api/generations/status?ids=… and /api/renders/status?ids=… (our DB only)
  ▼
Next.js server (server actions + route handlers; auth() + workspace membership checked in each)
  ├─ submitGeneration(): resolve Tool → validate vs catalog → price → debit workspace credits (txn)
  │                       → POST Higgsfield /{model-path}?hf_webhook=… → store request_id
  ├─ cancelGeneration():  POST /requests/{id}/cancel → refund on "canceled"
  ├─ submitRender():      reel / overlay / before-after / export job → render_jobs queue
  ├─ generateCopy():      Anthropic API → listing description / captions (credit-metered)
  ├─ /api/upload:         signed upload URL from Higgsfield (key stays server-side)
  ├─ /api/webhooks/higgsfield, /api/webhooks/stripe (verified, idempotent)
  ├─ /api/cron/reconcile: stuck generations + stuck render jobs
  └─ finalize(): copy outputs to R2 → status → refund if failed/nsfw
  ▼
MongoDB Atlas      Cloudflare R2      Stripe      Resend      Render worker (ffmpeg/sharp)
```

### Changes from the template

| Template does | We do |
|---|---|
| BYOK `KeyDialog` + key cookie | **One platform key** `HF_CREDENTIALS` in server env. Delete KeyDialog, key status, key cookie. |
| No users (`device.ts`) | Auth.js users **inside Workspaces**. Every doc has `workspaceId` + `createdBy`. |
| IndexedDB/zustand history & projects | **MongoDB.** Keep the `useRuns` interface so components don't change. "Projects" become **Properties**. |
| Client polls Higgsfield via server action | **Webhook first.** Client polls our DB-only status route. Never poll through a server action (Next serializes them per client). |
| Higgsfield CDN URLs | Copy to R2 on completion |
| Free | Credit-metered per workspace, Stripe-billed |
| Model-first studio | **Tool-first** panel; model picker only in "Avanzado" |

---

## 3. Higgsfield API integration (server only)

Verify everything against the live docs and log differences.

- **Base URL:** `HF_API_BASE_URL`, default `https://api.higgsfield.ai` (template uses `https://platform.higgsfield.ai`; use the documented one).
- **Auth:** `Authorization: Key {key_id}:{key_secret}`.
- **Submit:** `POST {BASE}/{model-path}` JSON → `{ status: "queued", request_id, status_url, cancel_url }`.
- **Webhook:** `?hf_webhook=<url-encoded>`. Terminal-state POSTs `{ request_id, status, error, payload }`, retried on network/5xx for ~2h, possibly duplicated → dedupe by `request_id + status`, reply < 10s.
  - No documented signature: webhook URL = `…/api/webhooks/higgsfield?gid={generationId}&t={HMAC_SHA256(generationId, HF_WEBHOOK_SECRET)}`, constant-time compare, and **never trust the payload** — always re-fetch `GET /requests/{id}/status`. Verify a signature header too if docs/SDK later define one.
  - Local dev without a public URL: skip `hf_webhook`, rely on the reconciler, or use `cloudflared`/`ngrok` when `HF_WEBHOOK_BASE_URL` is set.
- **Status:** `GET {BASE}/requests/{id}/status` → `{ status, request_id, images?, video?, error? }` + audio payloads per model docs.
- **Statuses:** `queued` (cancelable), `in_progress`, terminal `completed | failed | nsfw | canceled`. Failed/nsfw aren't billed to us → refund users.
- **Cancel:** `POST {BASE}/requests/{id}/cancel` (202 while queued, 400 once started). Real cancel, not "stop polling".
- **Uploads:** server calls `POST {BASE}/files/generate-upload-url` `{ content_type }` → `{ upload_url, public_url, content_type, upload_headers }`; browser PUTs with exactly those headers and `credentials: "omit"`. JPEG, PNG, WebP, GIF, MP4, WAV. **Never log signed URLs.** Reuse `upload-contract.ts`; add per-user rate limit + our size limits. Also keep the **original** upload in R2 (properties need their source photos long-term).
- **HEIC:** iPhone photos arrive as HEIC. Convert to JPEG with sharp before the Higgsfield upload (log the decision if sharp's HEIC support needs libheif).
- **Errors/rate limits:** per docs. Retry 429/5xx with exponential backoff + jitter; idempotency key if supported, otherwise a DB lock on the generation. Plain-Spanish error messages in the panel.

All of it in `lib/higgsfield/` with `import "server-only"`.

---

## 4. Model catalog + the Tool layer

### 4a. Model catalog (same contract as the template)

1. Start from `generation/catalog/models/*.ts` (`ModelEntry[]`: `id`, `surface`, `label`, `roles`, `mediaModes`, `requiredRoles`, `requirePrompt`, typed `settings`, `paths` or `toPlatform`). `scripts/sync-models.mjs` regenerates `models.generated.ts` — never hand-edit.
2. Add a model file (with docs URL) for every API model relevant to the vertical that the template lacks. Priority: **image edit / reference-guided** models (staging, declutter, day-to-dusk, finishes), **upscale / outpaint / background removal**, **image-to-video with first/last frame and camera control**, **text-to-speech and music/audio**.
3. Extend `Surface` to `"image" | "video" | "audio"`.
4. Add picker metadata (`description` in es + en, `bestFor`, `badges`, `provider`, `icon`).
5. `docs/model-catalog.md`: every model with surface, REST path(s), inputs, settings, price source, status (Live / Unverified / Not in API).

**Already in the template (verified paths):**
- Image: Soul 2 `higgsfield-ai/soul/v2/standard` · Soul Cinema `higgsfield-ai/soul/cinema` · Flux 2 `flux-2-pro` · Grok Imagine Image 2.0 `xai/grok-imagine-image-2.0` · Ideogram 4 `ideogram/v4.0` · Qwen Image 3 `alibaba/qwen-image-3/text-to-image` · Recraft 4.1 `recraft/v4.1/text-to-image` · Z-Image Turbo `z-image/turbo`
- Video: Seedance 2.5 `bytedance/seedance-2.5` (+ `/video-edit`, `/video-extend`) · Seedance 2.0 / Fast / Mini · Kling 3.0 Turbo/Std/Pro/4K · Kling 3.0 Motion Control · Kling 2.6 · Kling 2.5 Turbo · Kling O1/O3 first-last-frame · Wan 2.6 / 2.7 / 3.0 / 3.0 Prime · Happy Horse 1/1.1 · MiniMax Hailuo 2.3 · MiniMax H3 · LTX 2.5 · PixVerse 6 · Grok Imagine Video 1.5 · Flux 3 video · Higgsfield DoP `higgsfield-ai/dop/lite`

**Check and add if the REST API exposes them:** Nano Banana / 2 / Pro · GPT Image 2 / 2.5 · Seedream 4.5 / 5.0 Lite · Flux Kontext · Kling O1 Image · Google Veo 3 / 3.1 / 3.1 Lite · Seedance 1.5 Pro · upscale (image + video) · outpaint · background removal · reframe · **Audio:** TTS (es + en voices), Seed Audio, Mirelo text-to-audio, Sonilo music. If it exists only in Higgsfield's web app, mark "Not in API" — don't fake it.

### 4b. Tools (the vertical layer — replaces "Effects")

`generation/tools/*.ts`, one file per Tool:

```ts
type Tool = {
  slug: string;                 // "amueblado-virtual"
  vertical: "inmobiliaria" | "construccion" | "ambos";
  surface: "image" | "video" | "audio" | "compose" | "copy";
  name: { es: string; en: string };
  description: { es: string; en: string };
  candidates: ModelId[];        // compatible models, first = default after bake-off
  inputs: RoleSpec[];           // e.g. one "source" photo, optional "reference" style image
  options: ToolOption[];        // user-facing choices (style, time of day, camera move…) → prompt fragments/settings
  promptTemplate: { es: string; en: string };  // server-side; user text is appended, never replaces guardrails
  lockedSettings?: Partial<Settings>;
  disclosure?: DisclosureKind;  // see §9
  coverMedia: string;           // our own generated before/after
};
```

The server builds the final prompt from `promptTemplate + options + user notes`. Guardrail fragments in the template are not removable by the user.

**v1 Tool set** (each ships only if its default model passes the bake-off):

*Inmobiliaria*
| Tool | What it does | Disclosure |
|---|---|---|
| Amueblado virtual | Furnish an empty room. Styles: moderno, nórdico, tropical, minimalista, lujo, industrial. Guardrail: *preserve walls, windows, doors, floors, ceiling, fixtures, views and room proportions exactly* | `staging` |
| Vaciar espacio | Remove furniture/clutter from a room | `edited` |
| Día a atardecer | Exterior day photo → twilight with warm interior lights | `edited` |
| Cielo y jardín | Replace overcast sky; green up lawns | `edited` |
| Mejorar foto | Upscale + light/color enhancement for listing photos (no geometry changes) | none |
| Recorrido en video | One or more photos → smooth camera-move clips (push-in, pan, orbit) via image-to-video / first-last frame | `ai_motion` |
| Toma aérea ilustrativa | Exterior photo → drone-style establishing shot | `illustrative` |
| Voz del agente | Script → voiceover (TTS), es/en voices | none |

*Construcción / desarrolladoras*
| Tool | What it does | Disclosure |
|---|---|---|
| Render a video | Architectural render → cinematic flythrough clip | `render` |
| Plano/boceto a render | Floor plan or sketch → photoreal render (only if a verified model does this credibly; else "Not shipped") | `render` |
| Variantes de acabados | Same space with different floors / facades / kitchens | `render` |
| Escenas de vida en preventa | Add people and lifestyle to renders and amenities | `illustrative` |
| Avance de obra | Ordered site photos → before/after + progress timelapse (compose, optional AI transitions between frames) | none / `ai_motion` |

*Compose & copy (both verticals)* — see §8: Reel de propiedad (9:16), Anuncio estático (1:1, 4:5, 9:16), Antes/después, Exportar para portales, Descripción y captions.

### 4c. Bake-off (Phase 4)

Ask me for a test set (≈12 real photos: empty living room, empty bedroom, furnished kitchen, exterior day, overcast exterior, pool/amenity, render exterior, render interior, floor plan, sketch, 3 site-progress photos). If I don't provide one, use licensed stock and log licenses. For every Tool, run each candidate model on the relevant inputs, save outputs to `docs/bakeoff/`, and write `docs/tool-bakeoff.md`: quality notes, **did it alter architecture?**, cost per run, latency. Pick defaults from that. Tools with no passing model are not shipped.

### Validation

`submitGeneration` re-validates everything server-side: Tool exists and is enabled, model is in the Tool's `candidates` (or in the catalog for Avanzado mode), enums/ranges, required roles, max counts, prompt rules. Model paths come only from the catalog.

---

## 5. Authentication + Workspaces

- `next-auth@5`, `@auth/mongodb-adapter`, `mongodb`, `resend`, `@react-email/components` (check Next 16 compatibility).
- `auth.ts` exports `{ handlers, auth, signIn, signOut }`; `app/api/auth/[...nextauth]/route.ts` re-exports handlers.
- Resend provider with a **branded, bilingual React Email** magic-link template (lime button "Entrar a {{BRAND_NAME}}", fallback link, expiry note, plain text).
- `strategy: "database"`. Session exposes `user.id`, `user.role`, `activeWorkspaceId` only. **Never the credit balance.**
- Pages: `/login` (+ modal), `/login/check-email`, `/login/error`.
- **Workspaces (in scope for v1 — this is B2B):**
  - On first sign-in, create a personal workspace ("Mi empresa") and an `owner` membership. Onboarding asks: company name, type (Inmobiliaria / Agente independiente / Desarrolladora / Constructora), country, logo (optional) → seeds the brand kit.
  - Roles: `owner` (billing, delete), `admin` (members, brand kit), `member` (create content). Seat limit from plan.
  - Invites by email (Resend), token with expiry, accept via magic link. Workspace switcher in the header.
- Abuse controls: rate-limit magic links per email and IP (Mongo TTL collection); optional disposable-domain block.
- **Authorization:** every server action / route handler calls `auth()` and checks **workspace membership + role** on every document. `proxy.ts` only redirects signed-out users from `/app/**`, `/admin`. Never rely on it for security.
- Signed-out users see the landing, Tools gallery, Showcase and Pricing. Using a Tool opens the auth modal and resumes after sign-in (keep panel state).

---

## 6. Data model (MongoDB)

Typed collections + zod in `lib/db/`; idempotent `scripts/db-init.ts` for indexes. Atlas for transactions.

| Collection | Key fields | Indexes |
|---|---|---|
| Auth.js (`users`, `accounts`, `sessions`, `verification_tokens`) | + on users: `role` (`user`/`admin`), `locale`, `lastWorkspaceId` | adapter defaults |
| `workspaces` | `name`, `type`, `country`, `stripeCustomerId`, `plan`, `seats`, `planRenewsAt`, `credits: { subscription, topup }`, `disclosureSettings`, `createdAt` | `stripeCustomerId` unique sparse |
| `memberships` | `workspaceId`, `userId`, `role` | unique `{workspaceId, userId}`, `{userId}` |
| `invites` | `workspaceId`, `email`, `role`, `tokenHash`, `expiresAt`, `acceptedAt?` | TTL on `expiresAt`, `{workspaceId, email}` |
| `brand_kits` | `workspaceId`, `name`, `logoUrl`, `logoLightUrl?`, `colors{primary,secondary,text}`, `fontHeading`, `fontBody`, `agent{name, phone, whatsapp, email, photoUrl?}`, `watermark{enabled, position, opacity}`, `isDefault` | `{workspaceId}` |
| `properties` | `workspaceId`, `kind` (`listing`/`construction`), `title`, `status` (`activa`, `vendida`, `alquilada`, `en_obra`, `preventa`, `entregada`), `operation` (`venta`/`alquiler`), `price?{amount, currency}`, `address{line, district, canton, province, country}`, `specs{m2Built, m2Lot, bedrooms, bathrooms, parking, levels, amenities[]}`, `highlights[]`, `coverMediaId?`, `createdBy`, timestamps | `{workspaceId, updatedAt:-1}`, text index on title/address |
| `media` (originals) | `workspaceId`, `propertyId`, `kind`, `r2Key`, `url`, `hfPublicUrl?`, `contentType`, `bytes`, `width?`, `height?`, `durationSec?`, `room?` (`sala`, `cocina`, `habitacion`, `baño`, `exterior`, `amenidad`, `plano`, `obra`, `render`), `order`, `takenAt?` | `{propertyId, order}`, `{workspaceId, createdAt:-1}` |
| `generations` | `workspaceId`, `propertyId?`, `createdBy`, `toolSlug?`, `surface`, `modelId`, `modelPath`, `prompt` (final, server-built), `userNotes`, `options`, `settings`, `inputs[]` (role, mediaId, url), `status` (`pending_submit`, `queued`, `in_progress`, `completed`, `failed`, `nsfw`, `canceled`), `hfRequestId`, `cost`, `outputs[]` ({ kind, url, r2Key, width?, height?, durationSec? }), `sourceMediaId?` (for before/after), `disclosure?`, `error?`, `isPublic`, `publishedAt?`, `createdAt`, `finishedAt` | `{workspaceId, createdAt:-1}`, `{propertyId, createdAt:-1}`, `{hfRequestId}` unique sparse, `{status, updatedAt}`, `{isPublic, publishedAt:-1}` |
| `render_jobs` | `workspaceId`, `propertyId`, `type` (`reel`, `ad`, `before_after`, `export_pack`, `timelapse`), `spec` (JSON, see §8), `status` (`queued`, `rendering`, `completed`, `failed`), `cost`, `outputs[]`, `attempts`, `lockedUntil?`, `error?` | `{status, lockedUntil}`, `{propertyId, createdAt:-1}` |
| `copy_generations` | `workspaceId`, `propertyId`, `format`, `locale`, `tone`, `input` (facts snapshot), `output`, `cost`, `createdAt` | `{propertyId, createdAt:-1}` |
| `credit_ledger` (append-only) | `workspaceId`, `userId?`, `delta`, `bucket`, `reason` (`generation_debit`, `generation_refund`, `render_debit`, `render_refund`, `copy_debit`, `subscription_grant`, `subscription_reset`, `topup_purchase`, `signup_bonus`, `admin_adjust`, `stripe_refund`), `refType`, `refId`, `balanceAfter`, `createdAt` | **unique `{reason, refType, refId}`**, `{workspaceId, createdAt:-1}` |
| `stripe_events` | `_id = event.id`, `type`, `processedAt` | `_id` |
| `hf_webhook_events` | `requestId`, `status`, `receivedAt` | unique `{requestId, status}` |
| `tool_config` | `slug`, `enabled`, `defaultModelId`, `pricingOverride?`, `order` (DB overrides of code Tools) | `slug` unique |
| `model_pricing` | `modelId`, `rule`, `hfUsd` source, `enabled` | `modelId` unique |
| `rate_limits` | `key`, `count`, `expiresAt` | TTL |
| `audit_log` | `workspaceId`, `userId`, `action` (e.g. `disclosure_disabled`, `member_removed`), `meta`, `createdAt` | `{workspaceId, createdAt:-1}` |
| `reports` | showcase reports | `{generationId}` |

---

## 7. Credits, pricing and the generation lifecycle

### Pricing

- Higgsfield bills USD per model configuration (console price list + billing docs).
- `credits = ceil(hfUsdCost × CREDIT_MARKUP / CREDIT_USD_VALUE)` (`CREDIT_USD_VALUE` default `0.01`).
- Compose jobs: flat credits per output second / per export (config). Copy: flat credits per generation (config).
- `lib/billing/price.ts` → `priceFor(toolOrModel, settings, inputs) → credits`, pure, unit-tested, used by **both** the UI ("Generar ✦ 60") and the server. Never trust a client price.
- `model_pricing` / `tool_config` can override or disable.

### Two credit buckets (per workspace)

`subscription` credits **reset** each paid invoice; `topup` never expires. Spend subscription first. Both behaviors are config flags; log defaults.

### Submit (`submitGeneration`)

1. `auth()` + membership → resolve Tool → build prompt server-side → validate → `cost`.
2. **One transaction:** conditional decrement (fail `INSUFFICIENT_CREDITS` → upgrade modal), ledger `generation_debit`, insert `generations{status:"pending_submit"}`. Check plan concurrency limits in the same transaction.
3. Call Higgsfield with the webhook URL; save `hfRequestId`, `status:"queued"`.
4. Definite failure (4xx) → idempotent refund, `failed` with a plain Spanish error. Unclear (timeout/5xx after retries) → leave `pending_submit` for the reconciler. Never double-charge, never lose a charge.

### Finalize (`finalizeGeneration(requestId)`, shared by webhook, reconciler, manual refresh; idempotent)

1. Re-fetch status. Not terminal → update and return.
2. `completed`: stream outputs to R2 at `w/{workspaceId}/p/{propertyId|_}/g/{generationId}/{n}.{ext}`, record dimensions/duration, set `completed`, `finishedAt`, and attach `disclosure` from the Tool.
3. `failed` / `nsfw` / `canceled`: idempotent refund + readable error. nsfw → "Bloqueado por el filtro de contenido. Créditos reembolsados."
4. Conditional update on non-terminal status so concurrent finalizers can't both act.

### Reconciler `GET /api/cron/reconcile` (every minute, `CRON_SECRET`)

`pending_submit` > 2 min → resolve or refund. `queued`/`in_progress` stale > 3 min → finalize. > 15 min → failed + refund. Same for `render_jobs`: unlock stale locks, retry up to 2×, then fail + refund.

### Client status

`GET /api/generations/status?ids=…` and `/api/renders/status?ids=…` read our DB only, check membership, return `{ id, status, outputs, error }`. `useRuns` polls every 3–4s while anything is in flight. Generating/failed tiles stay in the feed.

---

## 8. Composition engine, brand kits and copy

### 8a. Render worker

- `lib/compose/` builds ffmpeg/sharp pipelines from a typed `spec`. Runs in a **worker** that claims `render_jobs` with a conditional `findOneAndUpdate` lock (`lockedUntil`).
- Default deployment: a Node route `POST /api/worker/render` (protected, `maxDuration` at the platform max) triggered right after submit and by the reconciler. If a reel can exceed that limit, run the same worker as a small long-running service (Fly.io/Railway/Render) polling Mongo. Pick one in Phase 6, log it, keep the worker code platform-agnostic.
- Inputs pulled from R2, outputs written to R2, then `completed` + "Su reel está listo" email (opt-out in account settings).

### 8b. Compose Tools

| Tool | Spec |
|---|---|
| **Reel de propiedad** | Ordered clips/photos (from originals or generations) → 9:16 1080×1920, 15–60s. Per clip: duration, Ken Burns move for stills, transition (cut/fade/slide). Optional music (generated via an audio model or uploaded, with license confirmation), optional voiceover (Voz del agente). Overlays from the brand kit: intro card (title, price, location), lower-thirds per clip (room labels, specs icons: m², habitaciones, baños, parqueos), outro card (logo, agent name, phone/WhatsApp, CTA). Auto-generated burned-in subtitles from the voiceover script. Disclosure line if any clip has a disclosure. |
| **Anuncio estático** | One image → 1080×1080, 1080×1350, 1080×1920 with headline, price, 3 key specs, CTA and logo, from 4 layout templates. |
| **Antes/después** | Pair `sourceMediaId` + generation → side-by-side still, split-wipe video (9:16 and 1:1), and the interactive slider in the app. |
| **Avance de obra / timelapse** | Ordered site photos by `takenAt` → aligned crossfade timelapse with date stamps; optional AI transition clips between frames (first-last frame model). |
| **Exportar para portales** | Zip of selected images resized/compressed to configurable presets (default: 1920×1080 JPEG, long edge 2048 JPEG, square 1080) + optional watermark. Presets live in config so portal specs can be updated without code. |

The **Reel composer** UI (`/app/properties/[id]/reels/[reelId]`) is deliberately simple: a vertical list of clips (drag to reorder), per-clip duration and label, music/voiceover pickers, overlay template picker, live cost, "Renderizar ✦ N". A low-res preview (canvas/`<video>` sequence) — no full NLE timeline.

### 8c. Brand kits

`/app/brand`: upload logo(s) (PNG/SVG, transparent), pick colors, fonts (curated Google Fonts list, self-hosted at render time), agent contact, watermark settings. Overlay templates read from the default brand kit; a property can pick another kit.

### 8d. Copy module (optional, behind `ANTHROPIC_API_KEY`)

- `generateCopy(propertyId, format, locale, tone)` → Anthropic Messages API, model from env `ANTHROPIC_MODEL`.
- Formats: descripción para portal (long), caption Instagram/Facebook (with hashtags), texto para anuncio (primary text + headline + description), mensaje de WhatsApp, guion de voz para el reel (15/30/60s, feeds Voz del agente). Tones: profesional, cercano, lujo.
- Input = a structured snapshot of the property's facts only. System prompt rules: **use only provided facts; never invent amenities, distances, prices, legal status or returns on investment; no discriminatory language about who may buy/rent; preconstruction copy says renders are illustrative.** Missing facts → leave them out, don't guess.
- Output is editable in the UI and saved to `copy_generations`. Credit-metered like everything else.

---

## 9. Disclosure & real estate content rules

- Every generation/render carries `disclosure: none | staging | edited | ai_motion | illustrative | render`.
- Default labels (es/en, editable per workspace): staging → "Amueblado virtual – imagen ilustrativa"; edited → "Imagen editada digitalmente"; illustrative → "Imagen ilustrativa generada con IA"; render → "Render ilustrativo, sujeto a cambios"; ai_motion → "Movimiento de cámara generado con IA".
- Labels are **on by default** in exports, ads and reels (small corner text using the brand kit font). An owner can turn them off per workspace only after an explicit confirmation dialog explaining portal and advertising risks; log it in `audit_log`.
- Export metadata: write an XMP/IPTC note ("AI-edited with {{BRAND_NAME}}") into exported JPEGs; investigate C2PA support and log the decision.
- Staging/edit Tools always keep the original linked (`sourceMediaId`) so the user can show the real photo next to it.
- Staging, declutter, sky and finish Tools never remove or add structural elements, defects or views; the bake-off explicitly checks this.

---

## 10. Stripe billing (workspace-level)

- `lib/billing/plans.ts`, Stripe price IDs from env. Plans (amounts `{{TBD}}`, ask at the Phase 5 checkpoint):
  - **Gratis** — sign-up bonus only, 1 seat, watermark forced on.
  - **Agente** — 1 seat, monthly credits, concurrency limits.
  - **Agencia** — up to 5 seats (extra seats as a per-seat price), more credits, brand kits ×3.
  - **Desarrolladora** — up to 15 seats, most credits, priority concurrency, timelapse/avance de obra, unlimited brand kits.
  - **Empresarial** — "Contactar" (mailto/form to SUPPORT_EMAIL), no checkout.
  - Monthly + annual ("20% OFF" + per-month equivalent). **Top-up packs** with better $/credit on higher plans. No "unlimited" anything.
- Currency: USD by default; log whether to offer CRC prices too (Stripe supports it).
- **Checkout** (subscription or payment), Stripe customer created lazily on the **workspace** with `metadata.workspaceId`, `client_reference_id = workspaceId`. Only `owner` can buy.
- **Customer Portal** from `/app/workspace/billing` (plan changes, seats, invoices, cancel).
- **Webhook** (Node runtime, raw body via `await req.text()`, `constructEvent`, dedupe on `stripe_events`):
  - `checkout.session.completed` (payment) → top-up credits (refId = session id)
  - `invoice.paid` (`subscription_create` / `subscription_cycle`) → **reset** subscription bucket to plan allowance (refId = invoice id); update `plan`, `seats`, `planRenewsAt`
  - `customer.subscription.updated` / `.deleted` → sync plan/seats; on cancel keep credits until period end; if seats drop below members, block new generations by extra members until fixed (never auto-remove people)
  - `charge.refunded` → claw back related top-up credits (not below 0), flag for admin
- `stripe listen --forward-to localhost:3000/api/webhooks/stripe` locally. Resend receipts for top-ups.

---

## 11. UI spec

Template components + **Quanta tokens**: dark backgrounds, lime **`#d1fe17`** as `--primary`, grotesk display headings, sans body, mono numbers. Lime only for the main CTA (Generar / Renderizar) and active states. All copy through `next-intl`.

### Global chrome

- **Marketing nav** (signed out): logo · Inmobiliarias · Constructoras · Herramientas · Ejemplos · Precios · Entrar · **Probar gratis** (lime).
- **App nav** (signed in): logo · **Propiedades** · **Estudio** (Imagen / Video / Audio) · **Herramientas** · **Marca** · right side: workspace switcher, credit pill (✦, links to billing), lime **Mejorar plan**, avatar menu (Cuenta, Equipo, Facturación, Idioma, Salir). Collapses to a sheet on mobile.
- Cookie consent (Aceptar todo / Rechazar no esenciales / Preferencias); no analytics before consent.

### Routes

| Route | What it is |
|---|---|
| `/` | Landing: hero with an auto-playing **before/after slider** (empty room → staged), headline like "CONTENIDO QUE VENDE PROPIEDADES", two vertical cards (Inmobiliarias / Constructoras) linking to `/inmobiliarias` and `/constructoras`, Tools strip with before/after covers, "Cómo funciona" (Sube fotos → Elige herramienta → Publica), pricing teaser, FAQ |
| `/inmobiliarias`, `/constructoras` | Vertical landing pages with their Tools and example outputs |
| `/herramientas`, `/herramientas/[slug]` | Tools gallery (filter chips: Inmobiliaria / Construcción / Video / Foto / Audio / Copy) → detail with before/after examples, cost "desde ✦N", "Usar herramienta" |
| `/app` | Dashboard: recent properties, quick Tools, credits by bucket, in-flight jobs |
| `/app/properties`, `/app/properties/new` | Property grid (cover, title, status chip, counts) with search/filter; creation form (facts from §6) + bulk photo upload with room tagging |
| `/app/properties/[id]` | Tabs: **Fotos originales** (reorder, tag rooms, pick cover) · **Generaciones** (justified feed) · **Reels y anuncios** · **Textos** · **Exportar**. Right rail: quick Tools applied to the selected photo |
| `/app/studio/image`, `/video`, `/audio` | Generator pages (layout below). `?tool=<slug>&property=<id>&media=<id>` pre-fills |
| `/app/properties/[id]/reels/[reelId]` | Reel composer (§8b) |
| `/app/brand` | Brand kits |
| `/app/workspace` (`/members`, `/billing`, `/settings`) | Members & invites, plan/seats/portal, disclosure settings, defaults |
| `/app/account` | Profile, language, email notifications, credit history (ledger) |
| `/ejemplos`, `/ejemplos/[id]` | Opt-in public **Showcase** of generations a workspace published (address and agent data stripped; only Tool, before/after and result). "Probar esta herramienta" CTA. Report button |
| `/precios` | Monthly/annual toggle, plan cards ("Más popular", "Mejor valor"), comparison table, top-ups, FAQ |
| `/login` (+ modal) | Magic link |
| `/admin` | Users/workspaces (adjust credits via `admin_adjust` with note), generations & render jobs by status/model/tool, Tool + model toggles and pricing overrides, showcase moderation |
| `/legal/terminos`, `/legal/privacidad`, `/legal/uso-aceptable` | Placeholders I'll replace (uso aceptable must cover misleading listings) |

### Generator page layout

- **Left panel** (~380px, own scroll, sticky footer):
  1. **Property selector** (combobox; "Sin propiedad" allowed in Studio, required for compose).
  2. **Tool card**: before/after cover loop, vertical label (INMOBILIARIA / CONSTRUCCIÓN), Tool name, **Cambiar** → Tool picker modal (searchable grid grouped by vertical, cost "desde ✦N"). An **Avanzado** switch swaps the Tool card for the template's model card + model picker.
  3. **Input slots** from the Tool: "Foto original" (pick from the property's photos via `AssetLibraryModal` with a Property tab, or upload), optional "Referencia de estilo", frame slots for video Tools. Per-kind limits enforced.
  4. **Options** as chips/segmented controls (style, time of day, camera move, duration, voice), not free settings.
  5. **Notas adicionales** textarea (appended to the server prompt; placeholder examples per Tool).
  6. Settings row: aspect ratio pill + resolution pill + "Más" (`SettingsDialog`) — only non-locked settings.
  7. Sticky lime **"Generar ✦ {cost}"** → **Cancelar** while queued; disabled with a reason on hover; upgrade modal when credits are short.
- **Right canvas**: header with **Historial** / **Cómo funciona** toggles and density control. Empty state (`ScreenEmptyState`): big uppercase headline per surface ("AMUEBLE CUALQUIER ESPACIO EN SEGUNDOS"), three step cards. Otherwise the justified virtualized feed filtered by surface (+ property if selected). `GenerationTile` states: generating (shimmer + elapsed), failed, nsfw, completed; disclosure badge on completed tiles. Hover rail (3 visible, rest in ⋯): Descargar, **Comparar antes/después**, Reutilizar, **Animar** (image → Recorrido en video with this as start frame), Mejorar (upscale), **Agregar a reel**, **Crear anuncio**, Mover a propiedad, Publicar en ejemplos, Eliminar.
- Lightbox (`GenerationDetailModal`): media, before/after slider when there's a source, Tool, model, options, cost, date, disclosure, same actions.
- Mobile: panel above feed, Generar as a bottom sticky bar. Property photo upload works from the phone camera roll. No second app shell.

### Polish rules

Template motion tokens, `prefers-reduced-motion`, visible focus, icon-button aria-labels match tooltips (in both locales). Lazy media in fixed aspect boxes; never unmount loaded media on fast scroll. **No inert controls** — unbuilt features have no button.

---

## 12. Security requirements (check before each checkpoint)

- `HF_CREDENTIALS`, `STRIPE_SECRET_KEY`, `AUTH_SECRET`, `AUTH_RESEND_KEY`, `ANTHROPIC_API_KEY`, R2 keys: server env only, `server-only` imports. A build-time test greps `.next/static` for key prefixes and fails the build.
- Every route/action: `auth()` + **workspace membership + role**; other workspaces' IDs return **404**.
- zod + catalog validation everywhere; model paths and prompts are built server-side.
- Webhooks: verification, idempotency, raw body for Stripe, fast 2xx after persisting.
- Rate limits: magic links, invites, uploads, submits, render jobs, copy, status polling.
- Credits: server-only, ledger-only, transactional, never below zero.
- Headers: CSP (R2 + Higgsfield CDN + Stripe.js), `frame-ancestors 'none'`, `Referrer-Policy`, HSTS in prod.
- Uploads: our own type/size checks; strip EXIF GPS from photos before any public use (showcase, exports unless the user opts in); never log signed URLs.
- Showcase: only explicitly published items, PII stripped, report + admin unpublish.
- Worker endpoint protected by a secret; render specs validated with zod (no arbitrary ffmpeg args or file paths from the client).
- Final audit against a vibe-security checklist (exposed keys, broken access control, client-side trust, payment integrity).

---

## 13. Environment variables (`.env.example`, documented)

```
# App
APP_URL=http://localhost:3000
NEXT_PUBLIC_BRAND_NAME={{BRAND_NAME}}
NEXT_PUBLIC_DEFAULT_LOCALE=es
# Auth.js
AUTH_SECRET=
AUTH_URL=http://localhost:3000
AUTH_RESEND_KEY=
EMAIL_FROM="{{EMAIL_FROM}}"
SIGNUP_BONUS_CREDITS=0
# MongoDB
MONGODB_URI=
MONGODB_DB={{APP_SLUG}}
# Higgsfield
HF_API_BASE_URL=https://api.higgsfield.ai
HF_CREDENTIALS=key_id:key_secret
HF_WEBHOOK_SECRET=
HF_WEBHOOK_BASE_URL=            # empty = reconcile-only (local dev)
# Credits
CREDIT_USD_VALUE=0.01
CREDIT_MARKUP={{CREDIT_MARKUP}}
# Copy module (optional)
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=
# Render worker
RENDER_WORKER_SECRET=
RENDER_WORKER_URL=              # empty = in-app route worker
# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_AGENTE_MONTHLY=
STRIPE_PRICE_AGENTE_ANNUAL=
STRIPE_PRICE_AGENCIA_MONTHLY=
STRIPE_PRICE_AGENCIA_ANNUAL=
STRIPE_PRICE_AGENCIA_SEAT=
STRIPE_PRICE_DESARROLLADORA_MONTHLY=
STRIPE_PRICE_DESARROLLADORA_ANNUAL=
STRIPE_PRICE_DESARROLLADORA_SEAT=
STRIPE_PRICE_TOPUP_SMALL=
STRIPE_PRICE_TOPUP_MEDIUM=
STRIPE_PRICE_TOPUP_LARGE=
# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=
# Cron
CRON_SECRET=
```

`lib/env.ts` validates with zod at boot and fails with a clear message.

---

## 14. Phases and checkpoints

| Phase | Scope | Checkpoint proof |
|---|---|---|
| **0. Research** | §1: clone repos, read docs, study UX references. Write `docs/ui-inventory.md`, `docs/model-catalog.md`, `docs/decisions.md`, `docs/screens/*`. Ask me for brand assets + the test photo set | Docs exist; model table complete with statuses |
| **1. Scaffold** | Template init, strip BYOK/device/IndexedDB, `next-intl` (es/en), `lib/env.ts`, Mongo client, `db-init`, lint/format/typecheck | App runs, template studio renders in Spanish, checks pass |
| **2. Auth + Workspaces** | Auth.js + Resend + adapter, bilingual email, login modal/pages, onboarding, workspaces, memberships, invites, switcher, `proxy.ts`, rate limits | Real magic link signs me in; I invite a second email, it joins with the right role; protected routes redirect |
| **3. Generation core** | `lib/higgsfield`, `submitGeneration` (platform key), Mongo generations, webhook, reconciler, status route, `useRuns` on Mongo, R2 copy, cancel, HEIC conversion | One image and one video model generate end to end, survive refresh, served from R2; cancel works |
| **4. Models + Tools + bake-off** | Verified models, audio surface, Tool layer (§4b), server prompt building + guardrails, re-validation, `docs/tool-bakeoff.md` | Snapshot tests of `toPlatform` per model and prompt builder per Tool; bake-off doc with outputs; every shipped Tool generates for real |
| **5. Credits + Stripe** | `priceFor`, ledger, transactions, plans/seats/top-ups, Checkout, Portal, webhook, receipts, upgrade modal | Tests: idempotent debit/refund, concurrent submits can't overdraw; test-mode subscription + top-up credit the right buckets; seat limit enforced |
| **6. Properties, brand kits, composition** | Properties CRUD + originals, brand kits, render worker, Reel, Anuncio, Antes/después, Avance de obra, Exportar, disclosure labels | A 30s 9:16 reel with voiceover, music, branded overlays and disclosure renders from a real property; ad + export zip work |
| **7. Copy module** | `generateCopy`, formats/tones, editable outputs, voiceover script → Voz del agente | Copy uses only provided facts (test with a sparse property: nothing invented) |
| **8. UI** | Landing + vertical pages, app nav, dashboard, property pages, generator pages, Tools gallery, Showcase, Pricing, Workspace/Account, Admin per `ui-inventory.md` | Screenshots of every page at 1440px and 390px, es and en |
| **9. Content + polish** | Generate our own landing/Tool cover before/afters with the app, replace every template placeholder, legal placeholders, a11y pass | No placeholders left; Lighthouse a11y ≥ 95 on main pages |
| **10. Hardening + deploy** | §12 audit, Playwright E2E, Vercel config (crons, env, function durations), worker deploy, Atlas indexes, R2 CORS, Stripe live checklist | E2E passes on a preview deploy; `docs/runbook.md` exists |

### Verification scenarios (Playwright + manual)

- Sign up, onboard as "Inmobiliaria", create a property with 8 photos from a phone (incl. HEIC), tag rooms.
- Amueblado virtual on the empty living room → before/after slider works, disclosure badge shows, architecture unchanged on the test photo.
- Día a atardecer on the exterior → Animar → Recorrido en video → add both to a reel with voiceover from a generated guion → render → email arrives → download shows disclosure label and brand outro.
- Anuncio estático in 3 sizes; Exportar zip with watermark.
- Constructora flow: render → Render a video; 4 site photos → Avance de obra timelapse with dates.
- Insufficient credits → upgrade modal → test-mode top-up → Generar works.
- nsfw, failed and canceled runs each leave a tile and refund exactly once, even with duplicate webhooks; a failed render job refunds once.
- No webhook URL: reconciler completes runs.
- Two tabs, credits for one run: exactly one succeeds.
- Member of workspace A can't read/modify anything in workspace B via any route; a `member` can't change billing or disclosure settings.
- 500+ generations, fast scroll keeps loaded media; property with 60 photos stays fast.
- 390px mobile: no horizontal scroll, Generar reachable, upload from camera roll.
- Switch locale to en: no untranslated strings.

---

## 15. Out of scope for v1 (leave clean extension points)

Direct publishing to listing portals, Meta/Instagram/TikTok/WhatsApp APIs · CRM integrations · 3D/virtual tours and Matterport · floor-plan measurement · AI avatar agent presenter (Soul ID training, v2: `characters` collection) · multi-shot cinematic editor · white-label for agencies · public API.

## 16. Definition of done

- Every page in §11 exists, matches `ui-inventory.md`, uses our brand, works in es and en. No Higgsfield marks, no placeholders.
- Every shipped Tool passed the bake-off and generates for real; unverified models are documented, not shown.
- Properties, brand kits, reels, ads, before/after, exports and copy work end to end with disclosure rules applied.
- Magic-link auth, workspaces/seats, credits, Stripe subscriptions and top-ups, webhooks, reconciler and render worker work together, with tests.
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` pass; Playwright passes on a preview deploy.
- `README.md` covers setup, env, local webhooks (Stripe CLI + tunnel), the render worker, how to add a model (one file + `pnpm models`) and **how to add a Tool** (one file + bake-off entry), and deployment.
