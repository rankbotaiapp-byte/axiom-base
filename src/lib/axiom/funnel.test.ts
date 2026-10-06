import assert from "node:assert/strict";
import test from "node:test";
import {
  channelFromPackage,
  followUpBody,
  followUpSchedule,
  funnelUrl,
  nurtureStatus,
  isEmailReady,
  isLeadSlug,
  isSmsReady,
  leadChannelTags,
  leadPublicTags,
  leadSlugFrom,
  OUTREACH_STRATEGIES,
  outreachPublicTokens,
  outreachStrategy,
  packOutreachPackage,
  parseFunnelQuery,
  parseFunnelSearch,
  parseHasWebsite,
  parsePhoneLine,
  parseReviewCount,
  parseReviewScore,
  renderOutreachMessage,
  strategyLabelFromPackage,
} from "./funnel.ts";

test("lead slugs stay url-safe", () => {
  assert.equal(leadSlugFrom("River Bend Rafting", "Moab"), "river-bend-rafting-moab");
  assert.equal(isLeadSlug("river-bend-rafting-moab"), true);
  assert.equal(isLeadSlug("River Bend"), false);
});

test("b wins over lead_slug and junk is dropped", () => {
  const query = parseFunnelQuery({
    b: "glass-eddy",
    lead_slug: "other-shop",
    utm_source: " regional ",
    county: "Grand County",
    noise: "nope",
  });
  assert.deepEqual(query, {
    leadSlug: "glass-eddy",
    utmSource: "regional",
    county: "Grand County",
    stopToken: "",
  });
  assert.equal(parseFunnelQuery({ b: "not a slug" }).leadSlug, "");
});

test("homepage search stays optional", () => {
  assert.deepEqual(parseFunnelSearch({}), {});
  assert.deepEqual(parseFunnelSearch({ b: "glass-eddy", county: "Grand" }), {
    b: "glass-eddy",
    lead_slug: "glass-eddy",
    county: "Grand",
  });
});

test("outreach drafts fill the business and its tracking link", () => {
  const message = renderOutreachMessage("Hello {business}\n{url}", {
    business: "Fade Masters Barbershop",
    url: "https://axiom.example/?b=fade-masters-miami",
  });
  assert.equal(message, "Hello Fade Masters Barbershop\nhttps://axiom.example/?b=fade-masters-miami");
});

test("public listing fields become tags and hook phrases", () => {
  assert.equal(parsePhoneLine("cell"), "mobile");
  assert.equal(parsePhoneLine(""), "");
  assert.equal(parseHasWebsite("no"), false);
  assert.equal(parseHasWebsite(""), null);
  assert.equal(parseReviewScore("4.76"), 4.8);
  assert.equal(parseReviewCount("126"), 126);
  assert.throws(() => parseReviewScore("6"), /between 0 and 5/);
  const facts = {
    contactName: "Luis Ortega",
    reviewScore: 4.8,
    reviewCount: 126,
    hasWebsite: false,
    phoneLine: "mobile" as const,
  };
  assert.deepEqual(leadPublicTags(facts), ["Luis Ortega", "4.8 · 126", "No website", "Mobile"]);
  assert.deepEqual(outreachPublicTokens(facts, "Fade Masters Barbershop"), {
    owner: "Luis Ortega",
    reviews: "4.8 from 126 reviews",
    website: "no website",
    line: "mobile",
  });
  const quiet = outreachPublicTokens(
    { contactName: "", reviewScore: null, reviewCount: null, hasWebsite: null, phoneLine: "" },
    "Fade Masters Barbershop",
  );
  assert.equal(quiet.owner, "Fade Masters Barbershop");
  assert.equal(quiet.reviews, "no public reviews");
  assert.equal(quiet.website, "no website listed");
  assert.equal(quiet.line, "listed number");
});

test("each hook writes a different text and email for the same lead", () => {
  const phrases = outreachPublicTokens(
    {
      contactName: "Luis Ortega",
      reviewScore: 4.8,
      reviewCount: 126,
      hasWebsite: false,
      phoneLine: "mobile",
    },
    "Fade Masters Barbershop",
  );
  const lead = {
    business: "Fade Masters Barbershop",
    url: "https://axiom.example/?b=fade-masters-miami",
    trade: "Barber",
    county: "Miami-Dade",
    city: "Miami",
    ...phrases,
  };
  const drafts = OUTREACH_STRATEGIES.map((item) => ({
    id: item.id,
    text: renderOutreachMessage(item.text, lead),
    email: renderOutreachMessage(`${item.emailSubject}\n${item.emailBody}`, lead),
  }));
  assert.equal(drafts.length, 3);
  for (const draft of drafts) {
    assert.match(draft.text, /Fade Masters Barbershop/);
    assert.match(draft.text, /fade-masters-miami/);
    assert.match(draft.email, /Luis Ortega/);
    assert.match(draft.email, /Miami-Dade/);
  }
  assert.match(drafts[0]?.text ?? "", /no website/);
  assert.match(drafts[1]?.text ?? "", /mobile/);
  assert.match(drafts[2]?.email ?? "", /4\.8 from 126 reviews/);
  assert.notEqual(drafts[0]?.text, drafts[1]?.text);
  assert.notEqual(drafts[1]?.email, drafts[2]?.email);
  assert.equal(outreachStrategy("missed-calls").label, "Missed Calls Hook");
  const packed = packOutreachPackage({
    strategy: "competitor-edge",
    text: "t",
    emailSubject: "s",
    emailBody: "b",
  });
  assert.equal(strategyLabelFromPackage(packed), "Competitor Edge Hook");
  assert.equal(strategyLabelFromPackage("plain text"), "");
  assert.equal(channelFromPackage(packed), "");
});

test("channel routing splits mobile lines from real email addresses", () => {
  assert.equal(isSmsReady("mobile"), true);
  assert.equal(isSmsReady("landline"), false);
  assert.equal(isSmsReady(""), false);
  assert.equal(isEmailReady("desk@rogueiron.example"), true);
  assert.equal(isEmailReady(""), false);
  assert.equal(isEmailReady("not-an-email"), false);
  assert.equal(isEmailReady("owner@shop"), false);
  const both = leadChannelTags({ contactEmail: "desk@rogueiron.example", phoneLine: "mobile" });
  assert.deepEqual(both, ["SMS-ready", "Email-ready"]);
  assert.deepEqual(leadChannelTags({ contactEmail: "", phoneLine: "mobile" }), ["SMS-ready"]);
  assert.deepEqual(leadChannelTags({ contactEmail: "desk@table.example", phoneLine: "landline" }), ["Email-ready"]);
  assert.deepEqual(leadChannelTags({ contactEmail: "none", phoneLine: "landline" }), ["No channel"]);
  const packed = packOutreachPackage({
    strategy: "done-for-you",
    text: "text",
    emailSubject: "subject",
    emailBody: "body",
    channel: "sms",
  });
  assert.equal(channelFromPackage(packed), "sms");
  assert.match(packed, /trickle/);
});

test("a nurture loop is day 0, day 3, and day 6, and a click stops it", () => {
  const start = new Date("2026-10-05T12:00:00.000Z");
  const plan = followUpSchedule(start);
  assert.deepEqual(plan.map((step) => step.day), [0, 3, 6]);
  assert.deepEqual(plan.map((step) => step.label), [
    "Day 0 Initial Hook",
    "Day 3 Competitor Proof Bump",
    "Day 6 Loss Aversion Final Call",
  ]);
  assert.equal(plan[0]?.status, "sent");
  assert.equal(plan[1]?.status, "scheduled");
  assert.equal(plan[2]?.scheduledAt, "2026-10-11T12:00:00.000Z");
  const launched = { text: "sms hook", emailSubject: "subject", emailBody: "email hook" };
  assert.equal(followUpBody(0, "sms", launched), "sms hook");
  assert.match(followUpBody(0, "email", launched), /email hook/);
  assert.match(followUpBody(3, "sms", launched), /Other \{trade\} shops/);
  assert.match(followUpBody(6, "email", launched), /Last call/);
  assert.notEqual(followUpBody(3, "sms", launched), followUpBody(6, "sms", launched));
  assert.equal(nurtureStatus({ clicked: false, touches: plan }), "active");
  assert.equal(nurtureStatus({ clicked: true, touches: plan }), "stopped");
  assert.equal(
    nurtureStatus({
      clicked: false,
      touches: plan.map((step) => ({ ...step, status: "sent" as const })),
    }),
    "complete",
  );
  assert.equal(nurtureStatus({ clicked: false, touches: [] }), "none");
});

test("campaign urls put the lead slug in b", () => {
  const url = new URL(funnelUrl("https://axiom.example/", { leadSlug: "glass-eddy", county: "Grand County" }));
  assert.equal(url.origin, "https://axiom.example");
  assert.equal(url.pathname, "/");
  assert.equal(url.searchParams.get("b"), "glass-eddy");
  assert.equal(url.searchParams.get("county"), "Grand County");
  assert.equal(url.searchParams.get("utm_source"), "regional");
  assert.equal(url.searchParams.get("t"), null);
  const armed = new URL(funnelUrl("https://axiom.example/", { leadSlug: "glass-eddy", county: "Grand County", stopToken: "ab".repeat(16) }));
  assert.equal(armed.searchParams.get("t"), "ab".repeat(16));
});
