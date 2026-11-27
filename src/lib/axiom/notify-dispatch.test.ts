import assert from "node:assert/strict";
import test from "node:test";
import {
  persistThenNotify,
  notifyShopResultFromChannels,
  formatNotifyDispatchDetail,
  EMPTY_NOTIFY_RESULT,
} from "./notify-dispatch.ts";
import { honorSimulatedBooking } from "./booking-simulation.ts";
import { stripeEventClaimed } from "./stripe-event-claim.ts";

test("persistThenNotify keeps the row when notify throws", async () => {
  const failed = await persistThenNotify(
    async () => ({ id: "lead_kept" }),
    async () => {
      throw new Error("Resend 500");
    },
  );
  assert.equal(failed.stored.id, "lead_kept");
  assert.equal(failed.notifyOk, false);
  assert.match(failed.notifyError, /Resend 500/);
});

test("persistThenNotify notifyOk is false when owner channels both miss", async () => {
  const missed = await persistThenNotify(
    async () => ({ id: "lead_1" }),
    async () => EMPTY_NOTIFY_RESULT,
  );
  assert.equal(missed.notifyOk, false);
  assert.match(missed.notifyError, /not reached|not attempted/);
});

test("persistThenNotify notifyOk is true when SMS landed", async () => {
  const sent = await persistThenNotify(
    async () => ({ id: "lead_2" }),
    async () =>
      notifyShopResultFromChannels(
        { ok: true, sid: "SM123" },
        { ok: false, skipped: true, error: "email skipped" },
      ),
  );
  assert.equal(sent.notifyOk, true);
  assert.equal(sent.notifyError, "");
});

test("duplicate persist skips a second notify", async () => {
  let notifies = 0;
  const dup = await persistThenNotify(
    async () => ({ id: "lead_dup", duplicate: true }),
    async () => {
      notifies += 1;
      return EMPTY_NOTIFY_RESULT;
    },
  );
  assert.equal(dup.notifyOk, true);
  assert.equal(notifies, 0);
});

test("public intake ignores client isSimulated without a master session", () => {
  assert.equal(honorSimulatedBooking({ masterAttached: false, clientFlag: true }), false);
  assert.equal(honorSimulatedBooking({ masterAttached: true, clientFlag: true }), true);
  assert.equal(honorSimulatedBooking({ masterAttached: true, clientFlag: false }), false);
});

test("stripe_events insert returning id is the claim", () => {
  assert.equal(stripeEventClaimed([{ id: "evt_1" }], "evt_1"), true);
  assert.equal(stripeEventClaimed([], "evt_1"), false);
  assert.equal(stripeEventClaimed([{ id: "evt_other" }], "evt_1"), false);
});

test("dispatch detail includes provider id without secrets", () => {
  const line = formatNotifyDispatchDetail({
    channel: "sms",
    to: "+15415550199",
    status: "sent",
    provider: "twilio",
    providerId: "SMabc",
    error: "",
  });
  assert.match(line, /id=SMabc/);
  assert.match(line, /status=sent/);
});
