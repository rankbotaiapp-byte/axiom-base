import { expect, test } from "playwright/test";

test.describe("Inbound AI lead pipeline webhook", () => {
  test("STOP returns TwiML opt-out and never books", async ({ request }) => {
    const res = await request.post("/api/outreach/inbound", {
      headers: { "content-type": "application/x-www-form-urlencoded" },
      data: "From=%2B15555550123&Body=STOP",
    });
    expect(res.ok()).toBeTruthy();
    expect(res.headers()["content-type"] ?? "").toMatch(/xml/);
    const xml = await res.text();
    expect(xml).toMatch(/<Response>/);
    expect(xml).toMatch(/unsubscribed|opt out|No further/i);
  });

  test("empty From returns empty TwiML", async ({ request }) => {
    const res = await request.post("/api/outreach/inbound", {
      headers: { "content-type": "application/x-www-form-urlencoded" },
      data: "Body=hello",
    });
    expect(res.ok()).toBeTruthy();
    expect(await res.text()).toMatch(/<Response><\/Response>/);
  });
});
