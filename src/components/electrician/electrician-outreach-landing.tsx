"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { BadgeCheck, Bolt, Phone, Zap } from "lucide-react";
import { OutreachCheckoutModal } from "@/components/plumbing/outreach-checkout-modal";
import { StorefrontHelpFab } from "@/components/storefront/StorefrontHelpFab";
import { LEAD_STORAGE_KEY } from "@/lib/axiom/funnel";
import {
  DEFAULT_ELECTRICIAN_OUTREACH,
  electricianHeroDefaults,
  liveCallHref,
  mergeElectricianHero,
  outreachIsSimulated,
  type ElectricianOutreachConfig,
  type OutreachTenant,
} from "@/lib/axiom/electrician-outreach";
import { ElectricianHero } from "./ElectricianHero";
import "./electrician-outreach.css";

function sessionKey(slug: string) {
  return `axiom.eo.session:${slug}`;
}

export function ElectricianOutreachLanding({
  config = DEFAULT_ELECTRICIAN_OUTREACH,
  tenant,
  studio = false,
  tracking,
}: {
  config?: ElectricianOutreachConfig;
  tenant: OutreachTenant;
  studio?: boolean;
  tracking?: { utmSource?: string; county?: string; stopToken?: string };
}) {
  const hero = useMemo(
    () =>
      mergeElectricianHero(tenant.hero as Partial<typeof electricianHeroDefaults> | undefined, {
        ...electricianHeroDefaults,
        ...config.hero,
        businessName: tenant.business || config.hero.businessName || electricianHeroDefaults.businessName,
        phone: tenant.phone || config.hero.phone,
      }),
    [config.hero, tenant.business, tenant.hero, tenant.phone],
  );
  const tel = liveCallHref(hero.phone);
  const [checkout, setCheckout] = useState(false);
  const [job, setJob] = useState(config.jobs[0]?.id ?? "outage");
  const [urgency, setUrgency] = useState(config.urgency[0]?.id ?? "emergency");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const openCheckout = useCallback(() => setCheckout(true), []);
  const closeCheckout = useCallback(() => setCheckout(false), []);

  useEffect(() => {
    if (studio) return;
    try {
      const saved = sessionStorage.getItem(sessionKey(tenant.slug));
      if (saved && /^cs_[A-Za-z0-9_]+$/.test(saved)) setCheckout(true);
    } catch {
      /* private mode */
    }
  }, [studio, tenant.slug]);

  useEffect(() => {
    if (studio || !tenant.slug) return;
    const utmSource = tracking?.utmSource || "regional";
    const county = tracking?.county || tenant.county || "";
    const seen = `axiom.outreach:${tenant.slug}|${utmSource}|electrical`;
    try {
      if (sessionStorage.getItem(seen) === "1") return;
      sessionStorage.setItem(seen, "1");
      sessionStorage.setItem(
        LEAD_STORAGE_KEY,
        JSON.stringify({ leadSlug: tenant.slug, tradeType: "electrical", county, utmSource }),
      );
    } catch {
      /* private mode */
    }
  }, [studio, tenant.county, tenant.slug, tracking?.utmSource]);

  async function onBook(event: FormEvent) {
    event.preventDefault();
    setError("");
    setStatus("");
    if (name.trim().length < 2 || phone.replace(/\D/g, "").length < 7) {
      setError("Add a name and a mobile number we can call.");
      return;
    }
    setBusy(true);
    try {
      const simulated = outreachIsSimulated();
      const response = await fetch("/api/leads/intake", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.slug || "electrical-preview",
          slug: tenant.slug || "cascade-electric",
          mode: urgency === "emergency" ? "hybrid-dispatch" : "instant-booking",
          contact: { name: name.trim(), phone: phone.trim() },
          answers: {
            service: job,
            urgency,
            address: address.trim(),
            trade: "electrical",
          },
          sourceRoute: `/t/${tenant.slug}?niche=electrical`,
          isSimulated: simulated,
        }),
      });
      const json = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !json.ok) {
        setError(json.error || "The desk could not save that request.");
        return;
      }
      setStatus(simulated ? "Request saved in simulation — live dispatch stays off." : "Request locked. A dispatcher has it.");
    } catch {
      setError("Check the connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="eo-root">
      <div className="eo-grid" aria-hidden="true" />
      <header className="eo-header">
        <div className="eo-bar">
          <div className="eo-logo" aria-hidden="true">
            <Zap size={22} />
          </div>
          <div className="eo-name">{hero.businessName}</div>
          {tel ? (
            <a className="eo-icon-btn" href={tel} aria-label={`Call ${hero.businessName}`}>
              <Phone size={20} />
            </a>
          ) : (
            <a className="eo-icon-btn" href="#book" aria-label="Book">
              <Bolt size={20} />
            </a>
          )}
        </div>
      </header>

      <ElectricianHero {...hero} />

      <main className="eo-wrap">
        <div className="eo-intro">
          <p className="eo-eyebrow">{hero.strip}</p>
          <h2 className="eo-head">
            {hero.urgency}
            <br />
            <em>{hero.urgencyAccent}</em>
          </h2>
          <p className="eo-sub">{hero.subhead}</p>
        </div>

        <ul className="eo-trust">
          {config.badges.map((badge) => (
            <li key={badge.id} className="eo-card">
              <BadgeCheck size={16} aria-hidden />
              {badge.label}
            </li>
          ))}
        </ul>

        <section className="eo-section" id="services">
          <p className="eo-sec-title">Core electrical</p>
          <h2 className="eo-sec-head">Six jobs we take today</h2>
          <div className="eo-services">
            {config.services.map((service) => (
              <article key={service.id} className="eo-svc">
                <div className="ic">
                  <Zap size={18} />
                </div>
                <div>
                  <h3>{service.title}</h3>
                  <p>{service.detail}</p>
                </div>
                <span className="eo-tag">{service.tag}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="eo-section" id="book">
          <p className="eo-sec-title">Book / SMS intake</p>
          <h2 className="eo-sec-head">Lock a visit</h2>
          <form className="eo-form" onSubmit={onBook}>
            <div>
              <label>Job type</label>
              <div className="eo-chips">
                {config.jobs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`eo-chip${job === item.id ? " on" : ""}`}
                    onClick={() => setJob(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label>Urgency</label>
              <div className="eo-chips">
                {config.urgency.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`eo-chip${urgency === item.id ? " on" : ""}`}
                    onClick={() => setUrgency(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </label>
            <label>
              Mobile
              <input value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" required />
            </label>
            <label>
              Address
              <input value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
            </label>
            {error ? <p className="eo-error">{error}</p> : null}
            {status ? <p className="eo-note">{status}</p> : null}
            <button type="submit" className="eo-btn eo-btn-book" disabled={busy}>
              {busy ? "Sending…" : "Send to dispatch"}
            </button>
            <p className="eo-note">555 placeholders never go to live SMS. Simulation mode keeps alerts off.</p>
          </form>
        </section>

        <section className="eo-section" id="hours">
          <p className="eo-sec-title">Hours</p>
          <div className="eo-hours">
            {config.hours.map((row) => (
              <div key={row.day}>
                <span>{row.day}</span>
                <b>{row.hours}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="eo-section eo-faq" id="faq">
          <p className="eo-sec-title">FAQ</p>
          {config.faq.map((item) => (
            <details key={item.id}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </section>

        <p className="eo-foot">
          {hero.businessName}
          {tenant.city ? ` · ${tenant.city}` : ""} · Powered by Axiom
        </p>
      </main>

      <nav className="eo-dock" aria-label="Call or book">
        {tel ? (
          <a className="eo-btn eo-btn-call" href={tel}>
            CALL
          </a>
        ) : (
          <a className="eo-btn eo-btn-call" href="#book">
            CALL
          </a>
        )}
        <a className="eo-btn eo-btn-book" href="#book">
          BOOK
        </a>
      </nav>

      <StorefrontHelpFab
        shopName={hero.businessName}
        slug={tenant.slug}
        phone={hero.phone}
        bookHref="#book"
        className="storefront-help-fab--raised"
      />
      <OutreachCheckoutModal isOpen={checkout} onClose={closeCheckout} />
      {studio ? (
        <button type="button" className="sr-only" onClick={openCheckout}>
          Open checkout
        </button>
      ) : null}
    </div>
  );
}

export function ElectricianOutreachLive({
  tenant,
  config = DEFAULT_ELECTRICIAN_OUTREACH,
  studio = false,
  tracking,
}: {
  tenant: OutreachTenant;
  config?: ElectricianOutreachConfig;
  studio?: boolean;
  tracking?: { utmSource?: string; county?: string; stopToken?: string };
}) {
  return <ElectricianOutreachLanding tenant={tenant} config={config} studio={studio} tracking={tracking} />;
}
