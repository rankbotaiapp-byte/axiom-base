import assert from "node:assert/strict";
import test from "node:test";
import { campaignOutcome, consumerLeadChannel, consumerOutreachCopy } from "./consumer-outreach.ts";

test("the campaign note names the shop, the city, and the booking link", () => {
  const note = consumerOutreachCopy({
    shopName: "The Chair",
    city: "New Era",
    consumerName: "Avery Cole",
    bookingCta: "Book a chair",
    bookUrl: "https://axiom.example/new-era-barbershop/book",
  });
  assert.equal(note.subject, "The Chair in New Era");
  assert.match(note.body, /^Hi Avery,/);
  assert.match(note.body, /Book a chair: https:\/\/axiom\.example\/new-era-barbershop\/book/);
});

test("a lead is emailed when the contact is an address, otherwise texted", () => {
  assert.deepEqual(consumerLeadChannel("", "", "jordan.hale@example.com"), {
    channel: "email",
    to: "jordan.hale@example.com",
  });
  assert.deepEqual(consumerLeadChannel("", "555-010-2001", ""), {
    channel: "sms",
    to: "+15550102001",
  });
  assert.equal(consumerLeadChannel("", "", "ask at the counter"), null);
});

test("simulation marks the whole batch contacted, and live retries the ones that did not send", () => {
  const rows = [
    { id: "a", delivered: true },
    { id: "b", delivered: false },
  ];
  assert.deepEqual(campaignOutcome("simulation", rows), { sent: 2, retryIds: [] });
  assert.deepEqual(campaignOutcome("live", rows), { sent: 1, retryIds: ["b"] });
});
