import "server-only";

import { getSessionUser } from "@/lib/auth/verify.server";
import { consumeGenerationCreditRpc, refundGenerationCreditRpc } from "./generation-quota.server";

export type GenerationGuardCode = "AUTH_REQUIRED" | "ACTIVE_TRIAL_REQUIRED" | "QUOTA_EXCEEDED";

export type GenerationGuardResult =
  | { allowed: true; userId: string; remaining?: number }
  | { allowed: false; status: 401 | 402; code: GenerationGuardCode; message: string };

function localGenerationBypass(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.AXIOM_LOCAL_AUTH === "true";
}

const MESSAGES: Record<GenerationGuardCode, string> = {
  AUTH_REQUIRED: "Sign in to run Axiom generation.",
  ACTIVE_TRIAL_REQUIRED: "Start the $1 trial to unlock AI generation.",
  QUOTA_EXCEEDED: "You have used all generations on your plan.",
};

export async function authorizeAndConsumeGeneration(
  userId: string | null | undefined,
  requestHeaders?: Headers,
): Promise<GenerationGuardResult> {
  let resolved = userId?.trim() || "";
  if (!resolved) {
    const session = await getSessionUser(undefined, requestHeaders).catch(() => null);
    resolved = session?.id?.trim() || "";
  }

  if (localGenerationBypass()) {
    return { allowed: true, userId: resolved || "local-generation-bypass" };
  }

  if (!resolved || resolved === "dev-user") {
    return { allowed: false, status: 401, code: "AUTH_REQUIRED", message: MESSAGES.AUTH_REQUIRED };
  }

  const consumed = await consumeGenerationCreditRpc(resolved);
  if (!consumed.ok) {
    const code = consumed.code === "QUOTA_EXCEEDED" ? "QUOTA_EXCEEDED" : "ACTIVE_TRIAL_REQUIRED";
    return {
      allowed: false,
      status: 402,
      code,
      message: MESSAGES[code],
    };
  }

  return { allowed: true, userId: resolved, remaining: consumed.remaining };
}

export async function refundGeneration(userId: string | null | undefined): Promise<void> {
  if (localGenerationBypass()) return;
  const id = userId?.trim();
  if (!id || id === "local-generation-bypass" || id === "dev-user") return;
  await refundGenerationCreditRpc(id);
}

export function generationGuardJson(result: Extract<GenerationGuardResult, { allowed: false }>) {
  return {
    error: result.message,
    code: result.code,
    trialRequired: result.status === 402,
  };
}