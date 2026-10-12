import { createAuthMiddleware } from "better-auth/api";
import type { BetterAuthPlugin } from "better-auth";

/**
 * This app signs people in with Better Auth (`public."user"`).
 * Accounts created in the Supabase dashboard live in `auth.users` instead,
 * so a normal sign-in finds nobody and returns 401 ("User not found" in the log).
 *
 * When the email is missing here but the password matches that Supabase account,
 * copy the person into Better Auth and let the normal sign-in continue.
 */
export function supabaseIdentityBridge(): BetterAuthPlugin {
  return {
    id: "supabase-identity-bridge",
    hooks: {
      before: [
        {
          matcher: (ctx) => ctx.path === "/sign-in/email",
          handler: createAuthMiddleware(async (ctx) => {
            const email = String(ctx.body?.email ?? "").trim().toLowerCase();
            const password = String(ctx.body?.password ?? "");
            if (!email.includes("@") || password.length < 8) return;
            const existing = await ctx.context.internalAdapter.findUserByEmail(email);
            if (existing) return;
            try {
              await copySupabaseUser(ctx, email, password);
            } catch (err) {
              console.error("[auth] could not read the Supabase account", err instanceof Error ? err.message : err);
            }
          }),
        },
      ],
    },
  };
}

type AuthCtx = Parameters<Parameters<typeof createAuthMiddleware>[0]>[0];

async function copySupabaseUser(ctx: AuthCtx, email: string, password: string) {
  const { getSql } = await import("../db");
  const sql = await getSql();
  const rows = await sql<{ id: string; email: string; name: string; verified: boolean }>`
    select u.id::text as id,
           lower(u.email) as email,
           coalesce(
             nullif(u.raw_user_meta_data->>'full_name', ''),
             nullif(u.raw_user_meta_data->>'name', ''),
             split_part(u.email, '@', 1)
           ) as name,
           (u.email_confirmed_at is not null) as verified
    from auth.users u
    where lower(u.email) = ${email}
      and u.encrypted_password is not null
      and u.encrypted_password = extensions.crypt(${password}, u.encrypted_password)
    limit 1
  `;
  const row = rows[0];
  if (!row?.id || !row.email) return;
  const hash = await ctx.context.password.hash(password);
  const created = await ctx.context.internalAdapter.createUser({
    id: row.id,
    email: row.email,
    name: row.name || row.email.split("@")[0] || "Owner",
    emailVerified: Boolean(row.verified),
  });
  if (!created?.id) return;
  await ctx.context.internalAdapter.linkAccount({
    userId: created.id,
    providerId: "credential",
    accountId: created.id,
    password: hash,
  });
}
