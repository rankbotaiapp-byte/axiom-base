const niches = ["bow-tech", "auto", "electrical", "forestry", "plumbing"];
for (const niche of niches) {
  const response = await fetch(`http://127.0.0.1:8080/demo/${niche}`);
  const html = await response.text();
  const films = [...new Set(html.match(/\/media\/[a-z0-9-]+-hero-animation\.mp4/g) ?? [])];
  const ctas = [...new Set(html.match(/Book [^<"]{3,48}/g) ?? [])];
  const crashed = /Application error|does not provide an export|reviveInvokeError/.test(html);
  console.log(response.status, niche, films.join(",") || "no-film", ctas.slice(0, 2).join(" | ") || "no-cta", crashed ? "CRASH" : "ok");
}
const create = await fetch("http://127.0.0.1:8080/api/shops/create", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ niche: "massage", name: "Nope" }),
});
console.log("create", create.status, (await create.text()).slice(0, 140));
const cron = await fetch("http://127.0.0.1:8080/api/outreach/cron", { method: "POST" });
console.log("cron", cron.status);
const stripe = await fetch("http://127.0.0.1:8080/api/webhooks/stripe", {
  method: "POST",
  headers: { "content-type": "application/json", "stripe-signature": "t=1,v1=dead" },
  body: "{}",
});
console.log("stripe", stripe.status, (await stripe.text()).slice(0, 80));
const home = await fetch("http://127.0.0.1:8080/");
console.log("home", home.status);
