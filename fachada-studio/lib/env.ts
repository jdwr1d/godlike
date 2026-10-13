import "server-only";
import { z } from "zod";

// Required now vs. later: variables for features not yet built are optional so
// the app boots during early phases. Tighten as each phase lands.
const schema = z.object({
  APP_URL: z.url().default("http://localhost:3000"),
  AUTH_SECRET: z.string().min(1).optional(),
  AUTH_RESEND_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
  SIGNUP_BONUS_CREDITS: z.coerce.number().int().min(0).default(0),
  MONGODB_URI: z.string().min(1).optional(),
  MONGODB_DB: z.string().min(1).default("fachada-studio"),
  HF_API_BASE_URL: z.url().default("https://api.higgsfield.ai"),
  HF_CREDENTIALS: z.string().regex(/^[^:]+:[^:]+$/, "expected key_id:key_secret").optional(),
  HF_WEBHOOK_SECRET: z.string().min(1).optional(),
  HF_WEBHOOK_BASE_URL: z.string().optional(),
  CREDIT_USD_VALUE: z.coerce.number().positive().default(0.01),
  CREDIT_MARKUP: z.coerce.number().positive().default(2.5),
  CRON_SECRET: z.string().min(1).optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;
