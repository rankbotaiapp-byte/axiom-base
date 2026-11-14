import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function signIn(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "");
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) redirect("/admin/login?e=1");
  (await cookies()).set("axiom_admin", token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  redirect("/admin");
}

export const metadata = { robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  return (
    <main className="ambient grid min-h-svh place-items-center px-5">
      <form action={signIn} className="glass w-full max-w-sm space-y-4 p-6">
        <h1 className="display text-2xl">Axiom admin</h1>
        <input className="field" name="token" type="password" placeholder="Admin token" autoComplete="current-password" required />
        {e ? <p className="text-sm text-[#ff9b8a]">Wrong token.</p> : null}
        <button className="tb tb-ice w-full" type="submit"><span className="tb-label">Sign in</span></button>
      </form>
    </main>
  );
}
