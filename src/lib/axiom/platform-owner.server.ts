import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";

/** Comma-separated sign-in emails. Server-only. Never sent to the browser. */
export function masterEmails(): string[] {
  return (env("MASTER_ADMIN_EMAIL") ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export async function isPlatformOwner(userId: string): Promise<boolean> {
  const allow = masterEmails();
  if (!allow.length || !userId) return false;
  const sql = await getSql();
  const rows = await sql<{ email: string | null }>`
    select "email" as email from "user" where id = ${userId} limit 1
  `;
  const email = rows[0]?.email?.trim().toLowerCase() ?? "";
  return email.length > 0 && allow.includes(email);
}

export async function assertPlatformOwner(userId: string): Promise<void> {
  if (masterEmails().length === 0) throw new Error("Master admin is not configured");
  if (!(await isPlatformOwner(userId))) throw new Error("Forbidden");
}
