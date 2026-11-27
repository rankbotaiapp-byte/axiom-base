import assert from "node:assert/strict";
import test from "node:test";
import {
  emptyChaChingMetrics,
  mergeChaChingMetrics,
  metricsFromAppointments,
  simulatedChaChingMetrics,
} from "./cha-ching-metrics.ts";
import { EMPTY_BOOK_MESSAGE, axiomSubscriptionCostCents, netRoiCents } from "./closed-job.ts";
import { AXIOM_PRO_MONTHLY_CENTS } from "./lifecycle.ts";
import type { Appointment, Service } from "./types.ts";

test("empty book ChaChing is $0 and never invents jobs", () => {
  const empty = metricsFromAppointments([], []);
  assert.equal(empty.jobsBookedToday, 0);
  assert.equal(empty.pipelineRevenueCents, 0);
  assert.equal(empty.emptyBook, true);
  assert.equal(empty.emptyMessage, EMPTY_BOOK_MESSAGE);
  assert.equal(empty.source, "live");
  const merged = mergeChaChingMetrics(null, null, "any-slug-hash-bait");
  assert.equal(merged.jobsBookedToday, 0);
  assert.doesNotMatch(JSON.stringify(merged), /simulated/);
  const sim = simulatedChaChingMetrics("hash-me-please");
  assert.equal(sim.jobsBookedToday, 0);
  assert.equal(sim.pipelineRevenueCents, 0);
});

test("Net ROI is verified revenue minus $150 unless trial or lifetime", () => {
  assert.equal(axiomSubscriptionCostCents({ plan: "lifetime" }), 0);
  assert.equal(axiomSubscriptionCostCents({ status: "trialing" }), 0);
  assert.equal(axiomSubscriptionCostCents({ priceCents: 100 }), 0);
  assert.equal(axiomSubscriptionCostCents({ awaitingFirstRealLead: true }), 0);
  assert.equal(axiomSubscriptionCostCents({ plan: "axiom_pro", status: "active", priceCents: 15000 }), AXIOM_PRO_MONTHLY_CENTS);
  assert.equal(netRoiCents(40_000, { plan: "axiom_pro", status: "active", priceCents: 15000 }), 40_000 - AXIOM_PRO_MONTHLY_CENTS);
  assert.equal(netRoiCents(40_000, { plan: "lifetime" }), 40_000);
  const emptyPro = emptyChaChingMetrics({ plan: "axiom_pro", status: "active", priceCents: 15000 });
  assert.equal(emptyPro.netRoiCents, -AXIOM_PRO_MONTHLY_CENTS);
});

test("live appointments do not invent $325 when price is missing", () => {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
  const today = `${ymd}T20:00:00.000Z`;
  const row = {
    id: "a1",
    shopId: "s1",
    employeeId: "e1",
    employeeName: "Pat",
    serviceId: "svc",
    serviceName: "Flush",
    customerName: "Sam",
    customerPhone: "+15415550148",
    startsAt: today,
    status: "confirmed",
    paymentStatus: "unpaid",
    paymentCents: 0,
    paymentRef: null,
  } as Appointment;
  const services: Service[] = [];
  const metrics = metricsFromAppointments([row], services);
  assert.equal(metrics.jobsBookedToday, 1);
  assert.equal(metrics.pipelineRevenueCents, 0);
});
