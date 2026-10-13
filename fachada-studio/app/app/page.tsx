import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Real authorization lives here (proxy.ts is only a redirect convenience).
export default async function Dashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <main className="flex flex-1 flex-col gap-2 p-8">
      <h1 className="text-2xl font-bold uppercase">Panel</h1>
      <p>{session.user.email}</p>
    </main>
  );
}
