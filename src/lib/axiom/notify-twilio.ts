/** Map Twilio REST failures to operator-safe detail (no secrets). */
export function twilioSmsFailureDetail(status: number, payload: unknown): string {
  const record =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as { code?: number; message?: string })
      : {};
  const code = Number(record.code);
  if (code === 21211 || code === 21401 || code === 21614) {
    return "Invalid destination phone number";
  }
  if (code === 21606 || code === 21612) {
    return "Twilio sending number is not valid for this destination";
  }
  if (code === 21610) return "Destination opted out of SMS";
  if (code === 20003 || status === 401 || status === 403) return "Twilio credentials were rejected";
  if (code === 21608 || /fund|balance|insufficient/i.test(String(record.message ?? ""))) {
    return "Twilio account has insufficient funds";
  }
  if (status === 429) return "Twilio rate limit hit — try again shortly";
  return "SMS provider rejected the message";
}
