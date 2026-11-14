/**
 * Axiom pre-launch k6 smoke/stress.
 *
 * Usage (dev server must already be up on 8080):
 *   k6 run scripts/load-test.js
 *   k6 run -e TARGET_URL=https://your-preview.example scripts/load-test.js
 *
 * Notes:
 * - There is no `/api/book` REST route. Bookings go through TanStack server fns.
 * - This script hits public HTML surfaces + a lightweight JSON ping, then a
 *   public consultation intake POST (mock, no Stripe/Twilio).
 */
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "5s", target: 50 },
    { duration: "20s", target: 50 },
    { duration: "5s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.001"],
  },
};

const SHOP = __ENV.SHOP_SLUG || "axiom-auto";

export default function () {
  const BASE_URL = (__ENV.TARGET_URL || "http://127.0.0.1:8080").replace(/\/$/, "");

  // 1. Public landing
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    "home status 200": (r) => r.status === 200,
  });

  // 2. Seeded storefront + booking page (HTML)
  const shopRes = http.get(`${BASE_URL}/${SHOP}`);
  check(shopRes, {
    "storefront status 200": (r) => r.status === 200,
  });

  const bookRes = http.get(`${BASE_URL}/${SHOP}/book`);
  check(bookRes, {
    "book page status 200": (r) => r.status === 200,
  });

  console.log("Home:", homeRes.status, "Book:", bookRes.status);

  // 3. Lightweight JSON probe
  const pingRes = http.get(`${BASE_URL}/api/hyper-moto/ping`);
  check(pingRes, {
    "ping status 200": (r) => r.status === 200,
    "ping ok": (r) => {
      try {
        return r.json("ok") === true;
      } catch {
        return false;
      }
    },
  });

  // 4. Public consultation intake (validated mock write path — not Stripe)
  //    Bookings are not REST `/api/book` — they use TanStack createServerFn.
  const payload = JSON.stringify({
    name: "Stress Test Lead",
    bike: "Apex GT3",
    goal: "Baseline dyno and street map",
    phone: "5550199000",
    source: "k6-load-test",
    page: `${BASE_URL}/${SHOP}`,
    transcript: [{ from: "client", text: "k6 stress" }],
  });

  const consultRes = http.post(`${BASE_URL}/api/hyper-moto/consultation`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  check(consultRes, {
    "consultation status ok": (r) => r.status === 200 || r.status === 201,
  });

  sleep(1);
}
