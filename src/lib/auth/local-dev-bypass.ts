import { createAuthMiddleware } from "better-auth/api";
import type { BetterAuthPlugin } from "better-auth";

/**
 * Local-only credential bypass for `npm run dev`.
 *
 * When `NODE_ENV !== "production"` (and not explicitly disabled), a sign-in with
 * any email + the local channel token (or an empty OTP from the portal) provisions
 * a Better Auth user, resets their credential to the shared local token, and
 * grants owner membership on the `axiom-auto` test shop — no Supabase OTP required.
 *
 * Production builds never register this plugin.
 */

export const LOCAL_DEV_CHANNEL_TOKEN = "__axiom_local_dev__";
export const LOCAL_DEV_DEFAULT_EMAIL = "admin@axiom.shop";
export const LOCAL_DEV_SHOP_SLUG = "axiom-auto";

/** True when any production/runtime signal says we are live traffic. */
export function isProductionRuntime(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  if (process.env.VERCEL_ENV === "production") return true;
  return false;
}

/**
 * Server-side gate — ALWAYS false in production / Vercel production.
 * `AXIOM_LOCAL_AUTH` is ignored there even if set to "true".
 */
export function localDevAuthAllowed(): boolean {
  // Hard production lock: never honor the bypass flag on live traffic.
  if (isProductionRuntime()) {
    if (process.env.AXIOM_LOCAL_AUTH?.trim()) {
      console.warn("[auth] AXIOM_LOCAL_AUTH is set but ignored in production");
    }
    return false;
  }
  const flag = process.env.AXIOM_LOCAL_AUTH?.trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "off") return false;
  // Explicit opt-in still allowed in non-production; default on for local npm run dev.
  if (flag === "1" || flag === "true" || flag === "on") return true;
  return true;
}

/** Client-safe mirror (Vite). Production bundles never enable the bypass UI. */
export function localDevAuthAllowedClient(): boolean {
  try {
    // Vite production + Node production — never show or honor local bypass UI.
    if (import.meta.env.PROD || import.meta.env.MODE === "production") return false;
    if (typeof process !== "undefined" && process.env.NODE_ENV === "production") return false;
    const flag = String(import.meta.env.VITE_AXIOM_LOCAL_AUTH ?? "")
      .trim()
      .toLowerCase();
    if (flag === "0" || flag === "false" || flag === "off") return false;
    return Boolean(import.meta.env.DEV) || flag === "1" || flag === "true" || flag === "on";
  } catch {
    return false;
  }
}

export function isLocalDevChannelToken(password: string): boolean {
  const value = password.trim();
  if (!value) return true; // empty OTP → treat as local channel in portal
  if (value === LOCAL_DEV_CHANNEL_TOKEN) return true;
  if (value.toLowerCase() === "dev" || value.toLowerCase() === "local") return true;
  return false;
}

type AuthCtx = Parameters<Parameters<typeof createAuthMiddleware>[0]>[0];

async function ensureLocalCredential(ctx: AuthCtx, email: string, password: string) {
  const name = email.split("@")[0] || "Local Admin";
  const existing = await ctx.context.internalAdapter.findUserByEmail(email);
  let userId = existing?.user?.id as string | undefined;

  const hash = await ctx.context.password.hash(password);

  if (!userId) {
    const created = await ctx.context.internalAdapter.createUser({
      email,
      name,
      emailVerified: true,
    });
    userId = created?.id;
    if (!userId) throw new Error("Could not create local auth user");
    await ctx.context.internalAdapter.linkAccount({
      userId,
      providerId: "credential",
      accountId: userId,
      password: hash,
    });
  } else {
    const accounts = await ctx.context.internalAdapter.findAccounts(userId);
    const hasCredential = accounts.some((a: { providerId?: string }) => a.providerId === "credential");
    if (hasCredential) {
      await ctx.context.internalAdapter.updatePassword(userId, hash);
    } else {
      await ctx.context.internalAdapter.linkAccount({
        userId,
        providerId: "credential",
        accountId: userId,
        password: hash,
      });
    }
  }

  return { userId: String(userId), email, name };
}

async function grantAxiomAutoOwner(userId: string) {
  try {
    const { getSql } = await import("../db");
    const sql = await getSql();
    await sql`
      insert into shop_members (shop_id, user_id, role)
      select s.id, ${userId}, 'owner'
      from shops s
      where s.slug = ${LOCAL_DEV_SHOP_SLUG}
      on conflict (shop_id, user_id) do update set role = excluded.role
    `;
    await sql`
      update shops
      set owner_user_id = ${userId}, is_showcase = true, onboarding_step = 'complete'
      where slug = ${LOCAL_DEV_SHOP_SLUG}
    `;
  } catch (err) {
    console.warn(
      "[auth] local-dev: could not grant axiom-auto owner (shop may be dataset-only)",
      err instanceof Error ? err.message : err,
    );
  }
}

/**
 * Better Auth plugin — registers only when `localDevAuthAllowed()`.
 * Mutates the inbound password to the shared local token when the portal sends
 * an empty OTP, then ensures the user + credential exist before email sign-in.
 */
export function localDevAuthBypass(): BetterAuthPlugin {
  return {
    id: "axiom-local-dev-bypass",
    hooks: {
      before: [
        {
          matcher: (ctx) => ctx.path === "/sign-in/email",
          handler: createAuthMiddleware(async (ctx) => {
            if (!localDevAuthAllowed()) return;

            const email = String(ctx.body?.email ?? "").trim().toLowerCase();
            const rawPassword = String(ctx.body?.password ?? "");
            if (!email.includes("@")) return;
            if (!isLocalDevChannelToken(rawPassword)) return;

            const password = LOCAL_DEV_CHANNEL_TOKEN;
            // Normalize empty / alias OTP → shared local token for the credential check.
            if (ctx.body && typeof ctx.body === "object") {
              (ctx.body as { password?: string }).password = password;
            }

            try {
              const user = await ensureLocalCredential(ctx, email, password);
              await grantAxiomAutoOwner(user.userId);
              console.info(`[auth] local-dev sign-in provisioned ${email} → owner on ${LOCAL_DEV_SHOP_SLUG}`);
            } catch (err) {
              console.error(
                "[auth] local-dev provision failed",
                err instanceof Error ? err.message : err,
              );
            }
          }),
        },
        {
          matcher: (ctx) => ctx.path === "/sign-up/email",
          handler: createAuthMiddleware(async (ctx) => {
            if (!localDevAuthAllowed()) return;
            const email = String(ctx.body?.email ?? "").trim().toLowerCase();
            if (!email.includes("@")) return;
            // After sign-up completes, membership is granted on the next sign-in.
            // Also accept empty passwords by filling the local token.
            const rawPassword = String(ctx.body?.password ?? "");
            if (isLocalDevChannelToken(rawPassword) && ctx.body && typeof ctx.body === "object") {
              (ctx.body as { password?: string }).password = LOCAL_DEV_CHANNEL_TOKEN;
            }
          }),
        },
      ],
      after: [
        {
          matcher: (ctx) => ctx.path === "/sign-up/email",
          handler: createAuthMiddleware(async (ctx) => {
            if (!localDevAuthAllowed()) return;
            const email = String(ctx.body?.email ?? "").trim().toLowerCase();
            if (!email.includes("@")) return;
            try {
              const existing = await ctx.context.internalAdapter.findUserByEmail(email);
              const row = existing as { user?: { id?: string }; id?: string } | null;
              const userId = row?.user?.id ?? row?.id;
              if (userId) await grantAxiomAutoOwner(String(userId));
            } catch {
              /* ignore */
            }
          }),
        },
      ],
    },
  };
}
