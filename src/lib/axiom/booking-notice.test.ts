import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bookingNoticeCopy, noticeKindFor } from "./booking-notice.ts";

const base = {
  shopName: "Glass Eddy",
  guestName: "Ada",
  serviceName: "Morning half-day",
  employeeName: "Willa Grant",
  when: "Sat, Oct 10, 7:00 AM",
};

describe("booking notices", () => {
  it("tells the station and the guest that a request arrived", () => {
    const copy = bookingNoticeCopy({
      ...base,
      phase: "request",
      guestPhone: "(541) 555-0148",
      guestEmail: "ada@example.com",
    });
    assert.equal(copy.kind, "booking_request");
    assert.match(copy.staff.body, /Ada requested Morning half-day/);
    assert.match(copy.guest.body, /Glass Eddy received your request/);
    assert.match(copy.owner.body, /Phone: \(541\) 555-0148/);
    assert.match(copy.owner.body, /Email: ada@example.com/);
    assert.doesNotMatch(copy.owner.body, /Email: \n/);
    assert.equal(noticeKindFor("request"), "booking_request");
  });

  it("tells the guest the time is confirmed", () => {
    const copy = bookingNoticeCopy({ ...base, phase: "confirmed" });
    assert.equal(copy.kind, "booking_confirmed");
    assert.match(copy.guest.subject, /confirmed your time/);
    assert.match(copy.staff.body, /Ada is confirmed/);
  });
});
