export type BookingPhase = "request" | "confirmed" | "paid";

export type NoticeKind =
  | "booking_request"
  | "booking_paid"
  | "inquiry"
  | "booking_confirmed"
  | "social_reauth"
  | "credits_empty";

export function formatBookingWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function noticeKindFor(phase: BookingPhase): NoticeKind {
  if (phase === "confirmed") return "booking_confirmed";
  if (phase === "paid") return "booking_paid";
  return "booking_request";
}

/** Copy for the shop inbox, the assigned station, and the guest. */
function contactBlock(phone?: string, email?: string): string {
  const lines = [
    phone?.trim() ? `Phone: ${phone.trim()}` : "",
    email?.trim() ? `Email: ${email.trim()}` : "",
  ].filter(Boolean);
  return lines.length ? `\n${lines.join("\n")}` : "";
}

export function bookingNoticeCopy(input: {
  phase: BookingPhase;
  shopName: string;
  guestName: string;
  serviceName: string;
  employeeName: string;
  when: string;
  guestPhone?: string;
  guestEmail?: string;
}): {
  kind: NoticeKind;
  owner: { subject: string; body: string };
  staff: { subject: string; body: string };
  guest: { subject: string; body: string };
} {
  const { shopName, guestName, serviceName, employeeName, when } = input;
  const withWhom = `${serviceName} with ${employeeName} at ${when}`;
  const contact = contactBlock(input.guestPhone, input.guestEmail);
  if (input.phase === "confirmed") {
    return {
      kind: "booking_confirmed",
      owner: {
        subject: `Confirmed · ${guestName}`,
        body: `${guestName} is confirmed for ${withWhom}.${contact}`,
      },
      staff: {
        subject: `Confirmed · ${guestName}`,
        body: `${guestName} is confirmed for ${serviceName} at ${when}.`,
      },
      guest: {
        subject: `${shopName} confirmed your time`,
        body: `${shopName} confirmed ${withWhom}.`,
      },
    };
  }
  if (input.phase === "paid") {
    return {
      kind: "booking_paid",
      owner: {
        subject: `Paid booking · ${guestName}`,
        body: `${guestName} paid for ${withWhom}.${contact}`,
      },
      staff: {
        subject: `Paid booking · ${guestName}`,
        body: `${guestName} paid for ${serviceName} at ${when}.`,
      },
      guest: {
        subject: `${shopName} received your payment`,
        body: `${shopName} received payment for ${withWhom}. The time is still waiting on a confirmation.`,
      },
    };
  }
  return {
    kind: "booking_request",
    owner: {
      subject: `New booking · ${guestName}`,
      body: `${guestName} requested ${withWhom}.${contact}`,
    },
    staff: {
      subject: `New booking · ${guestName}`,
      body: `${guestName} requested ${serviceName} at ${when}.`,
    },
    guest: {
      subject: `${shopName} received your request`,
      body: `${shopName} received your request for ${withWhom}. The time is held until they confirm it.`,
    },
  };
}
