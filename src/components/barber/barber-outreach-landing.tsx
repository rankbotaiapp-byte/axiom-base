"use client";

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { Phone, Scissors } from "lucide-react";
import { LEAD_STORAGE_KEY } from "@/lib/axiom/funnel";
import {
  DEFAULT_BARBER_OUTREACH,
  barberHeroDefaults,
  liveCallHref,
  mergeBarberHero,
  outreachIsSimulatedSafe,
  type BarberOutreachConfig,
  type OutreachTenant,
} from "@/lib/axiom/barber-outreach";
import { businessFromSlug } from "@/lib/axiom/plumber-outreach";
import "./barber-outreach.css";

function useBarberFonts() {
  useEffect(() => {
    if (document.getElementById("barber-fonts")) return;
    const link = document.createElement("link");
    link.id = "barber-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Inter:wght@400;500;700;800&display=swap";
    document.head.appendChild(link);
  }, []);
}

export function BarberOutreachLanding({
  config = DEFAULT_BARBER_OUTREACH,
  tenant,
  studio = false,
  tracking,
}: {
  config?: BarberOutreachConfig;
  tenant: OutreachTenant;
  studio?: boolean;
  tracking?: { utmSource?: string; county?: string; stopToken?: string };
}) {
  useBarberFonts();
  const hero = useMemo(
    () =>
      mergeBarberHero(tenant.hero as Partial<typeof barberHeroDefaults> | undefined, {
        ...barberHeroDefaults,
        ...config.hero,
        businessName: tenant.business || config.hero.businessName || businessFromSlug(tenant.slug) || "",
        phone: tenant.phone || config.hero.phone,
      }),
    [config.hero, tenant.business, tenant.hero, tenant.phone, tenant.slug],
  );
  const tel = liveCallHref(hero.phone);
  const overlayName = hero.businessName.trim();
  const [serviceId, setServiceId] = useState(config.services[0]?.id ?? "signature");
  const [slot, setSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (studio || !tenant.slug) return;
    const utmSource = tracking?.utmSource || "regional";
    const county = tracking?.county || tenant.county || "";
    const seen = `axiom.outreach:${tenant.slug}|${utmSource}|barber`;
    try {
      if (sessionStorage.getItem(seen) === "1") return;
      sessionStorage.setItem(seen, "1");
      sessionStorage.setItem(
        LEAD_STORAGE_KEY,
        JSON.stringify({ leadSlug: tenant.slug, tradeType: "barber", county, utmSource }),
      );
    } catch {
      /* private mode */
    }
  }, [studio, tenant.county, tenant.slug, tracking?.utmSource]);

  function openBook(id?: string) {
    if (id) setServiceId(id);
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  }

  async function onConfirm(event: FormEvent) {
    event.preventDefault();
    if (!slot) {
      setToast("Pick a time from today's openings.");
      return;
    }
    const service = config.services.find((row) => row.id === serviceId) ?? config.services[0];
    const first = name.trim().split(/\s+/)[0] || "friend";
    setBusy(true);
    try {
      await fetch("/api/leads/intake", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.slug || "barber-preview",
          slug: tenant.slug || "ashland-barber",
          mode: "instant-booking",
          contact: { name: name.trim() || "Walk-in", phone: phone.trim() || hero.phone },
          answers: { service: service?.title, time: slot, trade: "barber" },
          sourceRoute: `/t/${tenant.slug}?niche=barber`,
          isSimulated: outreachIsSimulatedSafe(),
        }),
      }).catch(() => undefined);
    } finally {
      setBusy(false);
    }
    setToast(`You're booked, ${first} — ${service?.title} at ${slot}. See you soon.`);
  }

  return (
    <div className="bs-root">
      <header>
        <div className="bs-bar">
          <div className="bs-logo" aria-hidden="true">
            <Scissors size={20} />
          </div>
          <div className="bs-name">{overlayName}</div>
          <a className="bs-icon-btn" href={tel} aria-label="Call the shop">
            <Phone size={18} />
          </a>
        </div>
      </header>

      <section className="bs-hero" aria-label="Shop hero">
        <div className="bs-stage">
          <img src={hero.poster} alt="Gold clipper, razor and shears on slate" />
          <div className="bs-shine" style={{ "--bs-mask": `url(${hero.mask})` } as CSSProperties} aria-hidden="true">
            <div className="bs-band" />
            <div className="bs-warm" />
          </div>
          <div className="bs-spark" aria-hidden="true" />
        </div>
        <div className="bs-vignette" />
        <div className="bs-corners" aria-hidden="true">
          <span className="a" />
          <span className="b" />
          <span className="c" />
          <span className="d" />
        </div>
        <div className="bs-hero-copy">
          <div className="bs-badge">{hero.badge}</div>
          {overlayName ? <p className="bs-overlay-name">{overlayName}</p> : null}
          <p className="bs-tagline">{hero.tagline}</p>
        </div>
      </section>

      <main className="bs-wrap">
        <p className="bs-eyebrow">{hero.eyebrow}</p>
        <h1 className="bs-h1">
          {hero.headline}
          <br />
          <em>{hero.headlineAccent}</em>
        </h1>
        <p className="bs-lede">{hero.lede}</p>
        <button type="button" className="bs-btn bs-btn-gold" data-book onClick={() => openBook()}>
          {hero.bookLabel}
        </button>
        <a className="bs-btn bs-btn-outline" href={tel}>
          {hero.callLabel}
        </a>
        <div className="bs-chips">
          {config.chips.map((chip) => (
            <span key={chip.id} className="bs-chip">
              {chip.label}
            </span>
          ))}
        </div>

        <section className="bs-sec">
          <p className="bs-sec-title">THE MENU</p>
          <div className="bs-menu">
            {config.services.map((row) => (
              <button key={row.id} type="button" className="bs-row" data-book onClick={() => openBook(row.id)}>
                <div>
                  <h3>{row.title}</h3>
                  <p>{row.detail}</p>
                </div>
                <span className="bs-price">{row.price}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="bs-sec">
          <p className="bs-sec-title">HOURS</p>
          <div className="bs-hours">
            {config.hours.map((row) => (
              <div key={row.day}>
                <span>{row.day}</span>
                <b>{row.hours}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="bs-sec" id="book">
          <h2 className="bs-book-title">BOOK YOUR CHAIR</h2>
          <form className="bs-form" onSubmit={onConfirm}>
            <label>
              Service
              <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                {config.services.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.title}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <label>Today's openings</label>
              <div className="bs-slots">
                {config.slots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    className={`bs-slot${slot === time ? " on" : ""}`}
                    onClick={() => setSlot(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </label>
            <label>
              Phone
              <input value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" />
            </label>
            <button type="submit" className="bs-btn bs-btn-gold" disabled={busy}>
              CONFIRM BOOKING
            </button>
          </form>
        </section>

        <p className="bs-foot">{config.footer}</p>
      </main>

      <button
        type="button"
        className="bs-help"
        onClick={() => setToast("Ask hours, cuts, or book a chair — the desk will take it from here.")}
      >
        HELP
      </button>
      <nav className="bs-dock" aria-label="Call or book">
        <a className="bs-btn bs-btn-outline" href={tel}>
          CALL
        </a>
        <button type="button" className="bs-btn bs-btn-gold" data-book onClick={() => openBook()}>
          BOOK
        </button>
      </nav>

      {toast ? (
        <div className="bs-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

export function BarberOutreachLive({
  tenant,
  config = DEFAULT_BARBER_OUTREACH,
  studio = false,
  tracking,
}: {
  tenant: OutreachTenant;
  config?: BarberOutreachConfig;
  studio?: boolean;
  tracking?: { utmSource?: string; county?: string; stopToken?: string };
}) {
  return <BarberOutreachLanding tenant={tenant} config={config} studio={studio} tracking={tracking} />;
}
