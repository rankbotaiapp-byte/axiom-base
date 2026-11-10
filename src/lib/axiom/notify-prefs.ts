/** Tenant lead-alert routing. Prefers dedicated notification_* over legacy notify_*. */

export type ShopNotifyPrefs = {
  notify_email?: string | null;
  notify_phone?: string | null;
  notify_sms_enabled?: boolean | number | string | null;
  notify_email_enabled?: boolean | number | string | null;
  notification_phone?: string | null;
  notification_email?: string | null;
};

export type ShopLeadAlertRoute = {
  smsEnabled: boolean;
  emailEnabled: boolean;
  phone: string;
  email: string;
  skipSms: boolean;
  skipEmail: boolean;
  smsSkipDetail: string;
  emailSkipDetail: string;
};

function asFlag(value: boolean | number | string | null | undefined, fallback: boolean): boolean {
  if (value === false || value === 0 || value === "false" || value === "0") return false;
  if (value === true || value === 1 || value === "true" || value === "1") return true;
  if (value == null || value === "") return fallback;
  return fallback;
}

export function resolveShopLeadAlerts(row: ShopNotifyPrefs | null | undefined): ShopLeadAlertRoute {
  const smsEnabled = asFlag(row?.notify_sms_enabled, true);
  const emailEnabled = asFlag(row?.notify_email_enabled, true);
  const phone = String(row?.notification_phone || row?.notify_phone || "").trim();
  const email = String(row?.notification_email || row?.notify_email || "").trim();
  return {
    smsEnabled,
    emailEnabled,
    phone,
    email,
    skipSms: !smsEnabled || !phone,
    skipEmail: !emailEnabled || !email,
    smsSkipDetail: !smsEnabled
      ? "SMS alerts are off"
      : !phone
        ? "No notification phone saved"
        : "",
    emailSkipDetail: !emailEnabled
      ? "Email alerts are off"
      : !email
        ? "No notification email saved"
        : "",
  };
}
