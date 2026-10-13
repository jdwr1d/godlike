import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold uppercase">Entrar</h1>
      <form
        action={async (formData) => {
          "use server";
          await signIn("resend", { email: String(formData.get("email") ?? ""), redirectTo: "/app" });
        }}
        className="flex flex-col gap-3"
      >
        <label htmlFor="email" className="text-sm">Correo electrónico</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="rounded-md border px-3 py-2" />
        <button type="submit" className="rounded-md bg-[#d1fe17] px-4 py-2 font-bold text-black">
          Enviar enlace
        </button>
      </form>
    </main>
  );
}
