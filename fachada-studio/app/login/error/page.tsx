import Link from "next/link";

export default function LoginError() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-2 p-6">
      <h1 className="text-2xl font-bold uppercase">No pudimos iniciar sesión</h1>
      <p>El enlace venció o ya fue usado. Solicite uno nuevo.</p>
      <Link href="/login" className="underline">Volver a entrar</Link>
    </main>
  );
}
