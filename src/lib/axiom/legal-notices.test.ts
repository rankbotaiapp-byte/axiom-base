import assert from "node:assert/strict";
import test from "node:test";
import {
  EMAIL_TCPA_FOOTER,
  MESSAGING_UI_NOTICE,
  PRIVACY_MOBILE_NO_SALE_CLAUSE,
  SMS_TCPA_FOOTER,
  STRIPE_CONNECT_NOTICE,
  SUBSCRIPTION_NOTICE,
  TERMS_RENEWAL_CLAUSE,
  TERMS_SMS_PROGRAM_CLAUSE,
  TRIAL_CHECKOUT_DISCLOSURE,
  UNLOCK_OFFER_COPY,
  appendMessagingNotice,
  finalizeOutreachBody,
  hasMessagingNotice,
  isMessagingHelp,
  isMessagingOptOut,
  smsHelpReply,
} from "./legal-notices.ts";

test("messaging notices append once and survive the SMS cap", () => {
  const sms = appendMessagingNotice("Hello {business}\n{url}", "sms");
  assert.match(sms, /Reply STOP to opt out/);
  assert.equal(appendMessagingNotice(sms, "sms"), sms);
  assert.equal(hasMessagingNotice(sms, "sms"), true);

  const email = appendMessagingNotice("Hi owner,\n\nClaim the page.", "email");
  assert.match(email, /unsubscribe/);
  assert.equal(appendMessagingNotice(email, "email"), email);

  const long = "x".repeat(700);
  const clipped = finalizeOutreachBody(long, "sms");
  assert.ok(clipped.length <= 640);
  assert.ok(clipped.endsWith(SMS_TCPA_FOOTER));
  assert.ok(finalizeOutreachBody("short note", "email").includes(EMAIL_TCPA_FOOTER));
});

test("shared legal copy stays short and names the three required notices", () => {
  assert.match(SUBSCRIPTION_NOTICE, /Payment is due at checkout/);
  assert.match(STRIPE_CONNECT_NOTICE, /Stripe Connect/);
  assert.match(STRIPE_CONNECT_NOTICE, /chargebacks/i);
  assert.match(MESSAGING_UI_NOTICE, /Reply STOP/);
  assert.ok(SUBSCRIPTION_NOTICE.length < 500);
  assert.ok(STRIPE_CONNECT_NOTICE.length < 400);
});

test("$1 unlock copy is one 14-day story with $150, lifetime, 1.5%, and STOP/HELP", () => {
  for (const block of [UNLOCK_OFFER_COPY, TRIAL_CHECKOUT_DISCLOSURE, TERMS_RENEWAL_CLAUSE]) {
    assert.match(block, /\$1\.00 today/);
    assert.match(block, /14 days/);
    assert.match(block, /\$150/);
    assert.match(block, /\$1,500/);
    assert.match(block, /1\.5%/);
    assert.doesNotMatch(block, /7 days/);
  }
  assert.match(TRIAL_CHECKOUT_DISCLOSURE, /Reply STOP/);
  assert.match(TRIAL_CHECKOUT_DISCLOSURE, /HELP/);
});

test("STOP and cancel keywords count as an opt-out", () => {
  assert.equal(isMessagingOptOut("STOP"), true);
  assert.equal(isMessagingOptOut("Stop."), true);
  assert.equal(isMessagingOptOut("unsubscribe please"), true);
  assert.equal(isMessagingOptOut("thanks, booked for Tuesday"), false);
  assert.equal(isMessagingHelp("HELP"), true);
  assert.equal(isMessagingHelp("STOP"), false);
  assert.match(smsHelpReply("https://www.rankbotapp.com"), /\/privacy/);
  assert.match(TERMS_SMS_PROGRAM_CLAUSE, /Reply STOP/);
  assert.match(PRIVACY_MOBILE_NO_SALE_CLAUSE, /does not sell mobile phone numbers/i);
});
