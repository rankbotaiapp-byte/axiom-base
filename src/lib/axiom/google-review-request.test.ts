import assert from "node:assert/strict";
import test from "node:test";
import {
  decideReviewRequestSms,
  extractCustomerPhoneFromProofCaption,
  ownerReviewReply,
  parseReviewCommand,
  sanitizeGoogleReviewUrl,
} from "./google-review-request.ts";

const owners = ["+15415550100"];
const url = "https://g.page/r/cascade-electric/review";

test("REVIEW <phone> parses US numbers and rejects junk", () => {
  assert.equal(parseReviewCommand("REVIEW 541-555-0148"), "+15415550148");
  assert.equal(parseReviewCommand("review +1 5415550148"), "+15415550148");
  assert.equal(parseReviewCommand("BOOK 5415550148"), null);
  assert.equal(parseReviewCommand("REVIEW later"), null);
});

test("proof captions yield a customer mobile and skip the owner line", () => {
  assert.equal(
    extractCustomerPhoneFromProofCaption("Panel swap for 541-555-0148", owners),
    "+15415550148",
  );
  assert.equal(extractCustomerPhoneFromProofCaption("Job photo", owners), null);
  assert.equal(extractCustomerPhoneFromProofCaption("Owner 541-555-0100 on site", owners), null);
});

test("Google review URLs stay on Google hosts over https", () => {
  assert.equal(sanitizeGoogleReviewUrl(url), url);
  assert.equal(sanitizeGoogleReviewUrl("http://g.page/r/x"), "");
  assert.equal(sanitizeGoogleReviewUrl("https://evil.example/review"), "");
});

test("REVIEW SMS respects owner, opt-out, missing URL, and A2P simulation", () => {
  const base = {
    ownerFrom: "+15415550100",
    ownerPhones: owners,
    customerRaw: "+15415550148",
    googleReviewUrl: url,
    shopName: "Cascade Electric",
    customerSuppressed: false,
    liveA2P: true,
  };
  const send = decideReviewRequestSms(base);
  assert.equal(send.action, "send");
  assert.match(send.body, /g\.page/);
  assert.match(send.body, /Reply STOP/i);

  const simulated = decideReviewRequestSms({ ...base, liveA2P: false });
  assert.equal(simulated.action, "simulate");
  assert.match(ownerReviewReply(simulated), /Simulation/);

  const opted = decideReviewRequestSms({ ...base, customerSuppressed: true });
  assert.equal(opted.action, "skip");
  assert.equal(opted.reason, "opted_out");
  assert.match(ownerReviewReply(opted), /opt-out/);

  const stranger = decideReviewRequestSms({ ...base, ownerFrom: "+15415550999" });
  assert.equal(stranger.action, "skip");
  assert.equal(stranger.reason, "not_owner");

  const noUrl = decideReviewRequestSms({ ...base, googleReviewUrl: "" });
  assert.equal(noUrl.action, "skip");
  assert.equal(noUrl.reason, "missing_google_review_url");

  const self = decideReviewRequestSms({ ...base, customerRaw: "+15415550100" });
  assert.equal(self.reason, "customer_is_owner");
});
