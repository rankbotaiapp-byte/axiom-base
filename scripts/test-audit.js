#!/usr/bin/env node
/**
 * Storefront audit check for new-era-barbershop.
 * Loads the shop tenant and a fresh consumer prospect, applies the barbershop
 * niche template, scores the audit the way StorefrontAuditWidget does, and
 * writes that row to client_audit_submissions. The row is removed after the check.
 *
 * Scores are whole numbers from 65 through 92. The barbershop niche is stored
 * as "location".
 */
import { readFileSync } from "node:fs";
import pg from "pg";

const SLUG = "new-era-barbershop";
const SCORE_MIN = 65;
const SCORE_MAX = 92;

/** First matching shop niche wins, same as presetForShopNiche. */
const TEMPLATES = [
  {
    id: "barbershop",
    shopNiche: "location",
    label: "Barbershop",
    auditTitle: "How soon do you need the chair?",
    bookingCta: "Book a chair",
    questions: [
      { id: "visit", choices: ["Cut", "Fade", "Beard"] },
      { id: "lastVisit", choices: ["This month", "A few months", "Not sure"] },
    ],
  },
];

const GENERAL = {
  id: "general",
  shopNiche: "trade",
  label: "Local service",
  auditTitle: "What do you need?",
  bookingCta: "Book a time",
  questions: [
    { id: "job", choices: ["Standard", "Larger", "Not sure"] },
    { id: "timing", choices: ["Soon", "This month", "Planning"] },
  ],
};

function databaseUrl() {
  const text = readFileSync(new URL("../.env", import.meta.url), "utf8");
  const line = text.split(/\r?\n/).find((row) => row.startsWith("DATABASE_URL="));
  if (!line) throw new Error("DATABASE_URL missing");
  return line.slice("DATABASE_URL=".length).trim().replace(/^"|"$/g, "");
}

function placeFromAddress(address) {
  const parts = String(address ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const city = parts.length >= 2 ? parts[1] : (parts[0] ?? "");
  return city.split("·")[0].trim();
}

function templateForNiche(niche) {
  return TEMPLATES.find((preset) => preset.shopNiche === niche) ?? GENERAL;
}

/** Same bounds as StorefrontAuditWidget. */
function auditScore() {
  return Math.floor(Math.random() * (SCORE_MAX - SCORE_MIN + 1)) + SCORE_MIN;
}

function defaultAnswers(template) {
  return Object.fromEntries(template.questions.map((question) => [question.id, question.choices[0] ?? ""]));
}

function fail(message) {
  console.error(`audit check failed: ${message}`);
  process.exitCode = 1;
}

for (let i = 0; i < 400; i += 1) {
  const sample = auditScore();
  if (!Number.isInteger(sample) || sample < SCORE_MIN || sample > SCORE_MAX) {
    fail(`score ${sample} is outside ${SCORE_MIN}-${SCORE_MAX}`);
    process.exit(1);
  }
}

const pool = new pg.Pool({
  connectionString: databaseUrl(),
  ssl: { rejectUnauthorized: false },
});

let submissionId = null;

try {
  const shops = await pool.query(
    `select s.id, s.slug, s.name, s.niche, s.address, t.user_id, t.email
     from shops s
     left join tenants t on t.shop_id = s.id
     where s.slug = $1
     limit 1`,
    [SLUG],
  );
  const shop = shops.rows[0];
  if (!shop) {
    fail(`no shop at ${SLUG}`);
    process.exit(1);
  }
  const city = placeFromAddress(shop.address);
  const template = templateForNiche(shop.niche);
  if (template.id !== "barbershop") {
    fail(`niche ${shop.niche} used template ${template.id}, expected barbershop`);
    process.exit(1);
  }

  const prospects = await pool.query(
    `select consumer_name, consumer_contact, note
     from consumer_prospects
     where lower(niche) = any($1::text[])
       and lower(btrim(split_part(city, '·', 1))) = lower($2)
       and batch_date = current_date
     order by created_at
     limit 1`,
    [["location", "barbershop"], city],
  );
  const prospect = prospects.rows[0];
  if (!prospect) {
    fail(`no fresh barbershop prospect in ${city || "the shop city"}`);
    process.exit(1);
  }
  if (prospect.consumer_name.trim().length < 2 || prospect.consumer_contact.trim().length < 3) {
    fail("prospect is missing a name or contact");
    process.exit(1);
  }

  const answers = defaultAnswers(template);
  const score = auditScore();
  const saved = await pool.query(
    `insert into client_audit_submissions (
       tenant_id, consumer_name, consumer_contact, property_or_project_details, audit_score
     ) values ($1, $2, $3, $4::jsonb, $5)
     returning id`,
    [shop.id, prospect.consumer_name, prospect.consumer_contact, JSON.stringify(answers), score],
  );
  submissionId = saved.rows[0].id;

  const row = await pool.query(
    `select tenant_id, consumer_name, consumer_contact, property_or_project_details, audit_score
     from client_audit_submissions
     where id = $1`,
    [submissionId],
  );
  const audit = row.rows[0];
  const details = audit.property_or_project_details;
  const questionIds = template.questions.map((question) => question.id);
  const savedIds = Object.keys(details);
  const choicesOk = template.questions.every((question) => question.choices.includes(details[question.id]));
  if (audit.tenant_id !== shop.id) fail("audit tenant does not match the shop");
  if (audit.consumer_name !== prospect.consumer_name || audit.consumer_contact !== prospect.consumer_contact) {
    fail("audit consumer does not match the prospect");
  }
  if (audit.audit_score !== score || audit.audit_score < SCORE_MIN || audit.audit_score > SCORE_MAX) {
    fail(`saved score ${audit.audit_score} is not the widget score ${score}`);
  }
  if (savedIds.length !== questionIds.length || questionIds.some((id) => !savedIds.includes(id)) || !choicesOk) {
    fail(`saved answers ${JSON.stringify(details)} do not match the ${template.label} template`);
  }
  if (process.exitCode) process.exit(1);

  console.log(
    `audit ${template.label}  ${template.auditTitle}  score ${audit.audit_score}  prospect ${prospect.consumer_name}  tenant ${shop.slug}`,
  );
  console.log(`template ${template.bookingCta}  questions ${questionIds.join(", ")}`);
} finally {
  if (submissionId) {
    await pool.query(`delete from client_audit_submissions where id = $1`, [submissionId]);
  }
  await pool.end();
}
