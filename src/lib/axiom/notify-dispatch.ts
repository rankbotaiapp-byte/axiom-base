export type NotifyDispatchStatus = "sent" | "skipped" | "failed";

export type NotifyDispatchLog = {
  channel: "sms" | "email";
  to: string;
  status: NotifyDispatchStatus;
  provider: "twilio" | "resend" | "none";
  providerId: string;
  error: string;
};

export type NotifyChannelResult = {
  ok: boolean;
  sid?: string;
  id?: string;
  error?: string;
  skipped?: boolean;
};

export type NotifyShopResult = {
  ok: boolean;
  sms: NotifyChannelResult;
  email: NotifyChannelResult;
};

export const EMPTY_NOTIFY_RESULT: NotifyShopResult = {
  ok: false,
  sms: { ok: false, skipped: true, error: "not attempted" },
  email: { ok: false, skipped: true, error: "not attempted" },
};

export function notifyShopResultFromChannels(sms: NotifyChannelResult, email: NotifyChannelResult): NotifyShopResult {
  return { ok: sms.ok === true || email.ok === true, sms, email };
}

export function isNotifyShopResult(value: unknown): value is NotifyShopResult {
  if (!value || typeof value !== "object") return false;
  const row = value as NotifyShopResult;
  return Boolean(row.sms) && Boolean(row.email) && typeof row.ok === "boolean";
}

/** Compact shop_notifications.detail + console line. Never includes secrets. */
export function formatNotifyDispatchDetail(log: NotifyDispatchLog): string {
  const parts = [
    `to=${log.to || "unset"}`,
    `status=${log.status}`,
    `provider=${log.provider}`,
  ];
  if (log.providerId) parts.push(`id=${log.providerId.slice(0, 80)}`);
  if (log.error) parts.push(`error=${log.error.slice(0, 120)}`);
  return parts.join(" ");
}

export function logNotifyDispatch(log: NotifyDispatchLog): void {
  console.info("[notify]", formatNotifyDispatchDetail(log));
}

function notifyOutcome(value: unknown): { notifyOk: boolean; notifyError: string } {
  if (isNotifyShopResult(value)) {
    const notifyError = value.ok
      ? ""
      : value.sms.error || value.email.error || "owner was not reached";
    return { notifyOk: value.ok, notifyError };
  }
  return { notifyOk: true, notifyError: "" };
}

/** Persist the booking/lead first. Provider timeouts must not roll back the row. */
export async function persistThenNotify<T>(
  persist: () => Promise<T>,
  notify: () => Promise<unknown>,
): Promise<{ stored: T; notifyOk: boolean; notifyError: string }> {
  const stored = await persist();
  if (stored && typeof stored === "object" && "duplicate" in stored && (stored as { duplicate?: boolean }).duplicate) {
    return { stored, notifyOk: true, notifyError: "" };
  }
  try {
    const result = await notify();
    const outcome = notifyOutcome(result);
    if (!outcome.notifyOk) {
      console.error("[notify] after persist", outcome.notifyError);
    }
    return { stored, ...outcome };
  } catch (err) {
    const notifyError = err instanceof Error ? err.message.slice(0, 200) : "notify failed";
    console.error("[notify] after persist", notifyError);
    return { stored, notifyOk: false, notifyError };
  }
}
