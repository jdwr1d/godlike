import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

function isLocale(value: string | undefined): value is Locale {
  return locales.some((l) => l === value);
}

// Locale comes from the NEXT_LOCALE cookie; Spanish is the default.
export default getRequestConfig(async () => {
  const cookie = (await cookies()).get("NEXT_LOCALE")?.value;
  const locale = isLocale(cookie) ? cookie : defaultLocale;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
