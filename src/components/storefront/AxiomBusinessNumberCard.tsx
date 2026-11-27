"use client";

import { useEffect, useState } from "react";
import type { AxiomBusinessNumberView } from "@/lib/axiom/axiom-business-number";
import { formatAxiomPhoneDisplay } from "@/lib/axiom/axiom-business-number";
import { conditionalForwardingCodes } from "@/lib/axiom/call-forwarding";
import "./axiom-business-number-card.css";

type Props = {
  slug: string;
  businessName: string;
  initial?: AxiomBusinessNumberView | null;
  showInstructions?: boolean;
  showNav?: boolean;
};

export function AxiomBusinessNumberCard({
  slug,
  businessName,
  initial = null,
  showInstructions = true,
  showNav = false,
}: Props) {
  const [record, setRecord] = useState<AxiomBusinessNumberView | null>(initial);
  const [copied, setCopied] = useState(false);
  const [copiedDial, setCopiedDial] = useState("");

  useEffect(() => {
    let stop = false;
    let tries = 0;
    let found = Boolean(initial?.e164);
    const load = () => {
      void fetch(`/api/storefront/business-number?slug=${encodeURIComponent(slug)}`)
        .then(async (response) => {
          if (!response.ok) return null;
          return (await response.json()) as AxiomBusinessNumberView;
        })
        .then((next) => {
          if (stop || !next) return;
          setRecord(next);
          if (next.e164) found = true;
        })
        .catch(() => undefined);
    };
    load();
    const timer = window.setInterval(() => {
      tries += 1;
      if (tries > 8 || found) {
        window.clearInterval(timer);
        return;
      }
      load();
    }, 2000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [slug, initial?.e164]);

  const e164 = record?.e164 || "";
  const display = e164 ? formatAxiomPhoneDisplay(e164) : "Provisioning…";
  const vcardHref = `/api/storefront/vcard?slug=${encodeURIComponent(slug)}`;
  const forwarding = e164 ? conditionalForwardingCodes(e164) : [];

  async function copyNumber() {
    if (!e164) return;
    try {
      await navigator.clipboard.writeText(e164);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="abn-card">
      <p className="abn-kicker">Axiom Business Number</p>
      <p className="abn-number">{display}</p>
      {!e164 ? (
        <p className="abn-pending">Your dedicated 10DLC line is attaching. This card updates as soon as it is locked.</p>
      ) : null}
      <div className="abn-actions">
        <button type="button" className="abn-btn abn-btn-gold" disabled={!e164} onClick={() => void copyNumber()}>
          {copied ? "Copied" : "Copy Number"}
        </button>
        {e164 ? (
          <a className="abn-btn abn-btn-cyan" href={vcardHref}>
            Save Contact (.vcf)
          </a>
        ) : (
          <span className="abn-btn abn-btn-cyan opacity-50">Save Contact (.vcf)</span>
        )}
      </div>
      {showInstructions ? (
        <ol className="abn-steps">
          <li>
            <span className="abn-index">1</span>
            <span>
              <strong>Lock this number into your phone now.</strong> Text any finished job photo (optional caption) to
              this number. Axiom runs the cinema finish and updates Proof of Work on your live customer page within
              seconds.
            </span>
          </li>
          <li>
            <span className="abn-index">2</span>
            <span>
              <strong>Or upload in your dashboard.</strong> Add, swap, or reorder Proof of Work photos and Hero media
              inside <code>/{slug}/admin</code>.
            </span>
          </li>
          <li>
            <span className="abn-index">3</span>
            <span>
              <strong>24/7 Dispatch & Booking.</strong> Incoming customer calls and texts to this number route into your
              Axiom booking and lead-capture engine.
            </span>
          </li>
        </ol>
      ) : (
        <p className="abn-pending">
          Text finished job photos to this number to update Proof of Work. Incoming calls and texts dispatch through
          Axiom.
        </p>
      )}
      {forwarding.length ? (
        <div className="abn-forward">
          <p className="abn-kicker">Keep Your Existing Business Number</p>
          <p className="abn-pending">
            15 seconds: miss a call on the number already on your truck, and it rings Axiom. Dial these from that
            line — you do not reprint wraps or cards.
          </p>
          <ul className="abn-forward-list">
            {forwarding.map((row) => (
              <li key={row.code}>
                <div>
                  <strong>
                    {row.code} · {row.label}
                  </strong>
                  <span>{row.when}</span>
                  <code>{row.dial}</code>
                </div>
                <button
                  type="button"
                  className="abn-btn abn-btn-cyan"
                  onClick={() => {
                    void navigator.clipboard.writeText(row.dial).then(() => {
                      setCopiedDial(row.code);
                      window.setTimeout(() => setCopiedDial(""), 1600);
                    });
                  }}
                >
                  {copiedDial === row.code ? "Copied" : "Copy dial"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {showNav ? (
        <div className="abn-links">
          <a className="abn-btn abn-btn-cyan" href={`/t/${encodeURIComponent(slug)}`}>
            Open Live Storefront
          </a>
          <a className="abn-btn abn-btn-gold" href={`/${encodeURIComponent(slug)}/admin`}>
            Open My Dashboard
          </a>
        </div>
      ) : null}
      <p className="sr-only">{businessName}</p>
    </section>
  );
}
