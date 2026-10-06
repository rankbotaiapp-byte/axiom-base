export type BookingPhase = "request" | "confirmed" | "paid";

export type NoticeKind = "booking_request" | "booking_paid" | "inquiry" | "booking_confirmed";

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
export function bookingNoticeCopy(input: {
  phase: BookingPhase;
  shopName: string;
  guestName: string;
  serviceName: string;
  employeeName: string;
  when: string;
}): {
  kind: NoticeKind;
  owner: { subject: string; body: string };
  staff: { subject: string; body: string };
  guest: { subject: string; body: string };
} {
  const { shopName, guestName, serviceName, employeeName, when } = input;
  const withWhom = `${serviceName} with ${employeeName} at ${when}`;
  if (input.phase === "confirmed") {
    return {
      kind: "booking_confirmed",
      owner: {
        subject: `Confirmed · ${guestName}`,
        body: `${guestName} is confirmed for ${withWhom}.`,
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
        body: `${guestName} paid for ${withWhom}.`,
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
      body: `${guestName} requested ${withWhom}.`,
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
