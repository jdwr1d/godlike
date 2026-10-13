import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations("Home");
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-4xl font-bold uppercase tracking-tight">{t("tagline")}</h1>
      <p className="max-w-md text-neutral-500">{t("description")}</p>
    </main>
  );
}
