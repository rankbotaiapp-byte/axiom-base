import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useBiokineticEngine } from "@/hooks/use-biokinetic-engine";
import { UNIVERSAL_FALLBACK } from "@/lib/axiom/hero-films";
import { NICHE_MEDIA } from "@/lib/axiom/media";

const BARBER_FILM = NICHE_MEDIA.location.heroVideoUrl;

function barberFilm(url?: string | null) {
  if (!url || url === UNIVERSAL_FALLBACK) return BARBER_FILM;
  return url;
}

const DEFAULT_OFFERS = [
  { name: "Signature cut", description: "Consultation, cut, finish.", price: "$48" },
  { name: "Skin fade", description: "Tight blend, razor line.", price: "$54" },
  { name: "Beard sculpt", description: "Shape, line-up, oil.", price: "$28" },
] as const;

export type MirrorOffer = {
  name: string;
  description: string;
  price: string;
};

const BARBER = /\b(barbers?|barbershops?|haircuts?)\b/i;

/** The mirror replaces the cinematic hero for the barber book. */
export function usesBarberMirror(niche: string, text = ""): boolean {
  if (BARBER.test(`${niche} ${text}`)) return true;
  return niche === "location";
}

export function BarberMirrorStudio({
  businessName,
  bookHref,
  services,
  filmUrl,
  children,
}: {
  businessName: string;
  bookHref?: string;
  services?: readonly MirrorOffer[];
  filmUrl?: string | null;
  children?: ReactNode;
}) {
  const offers = services && services.length > 0 ? services : DEFAULT_OFFERS;
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [details, setDetails] = useState(false);
  const [booking, setBooking] = useState(false);
  const [held, setHeld] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const biokinetic = useBiokineticEngine({
    cameraGranted: false,
    reducedMotion: reduce,
  });
  const offer = offers[index] ?? offers[0];

  return (
    <section
      className={
        booking
          ? "barber-stage relative z-50 h-screen min-h-[100dvh] w-full overflow-hidden"
          : "barber-stage relative h-screen min-h-[100dvh] w-full overflow-hidden"
      }
      aria-label="Barber mirror studio"
    >
      <motion.div className="barber-rig" style={{ scale: biokinetic.cameraDollyScale }}>
        <video
          className="barber-wall"
          src={barberFilm(filmUrl)}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <div className="barber-mirror">
          <div className="barber-glass relative h-full w-full overflow-hidden rounded-2xl" />
        </div>
        <div className="barber-frame-slot">
          <div className="barber-frame" />
        </div>
        <div className="barber-vanity">
          <div className="barber-unit" role="region" aria-label="Head unit">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted">{businessName}</p>
            <p className="mt-2 font-display text-2xl text-fg">{offer.name}</p>
            <p className="text-sm text-accent">{offer.price}</p>
            {details ? <p className="mt-2 text-sm text-muted">{offer.description}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="barber-key"
                onClick={() => {
                  setIndex((n) => (n + 1) % offers.length);
                  setDetails(false);
                }}
              >
                Next
              </button>
              <button type="button" className="barber-key" onClick={() => setDetails((on) => !on)}>
                View Details
              </button>
              <button
                type="button"
                className="barber-key is-primary"
                onClick={() => {
                  setHeld(false);
                  setBooking(true);
                }}
              >
                Book chair
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
        <div className="pointer-events-auto">{children}</div>
      </div>
      {booking ? (
        <div className="barber-book fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Book a chair">
          <div className="mx-auto flex h-full w-full max-w-lg flex-col justify-end px-5 py-8 sm:justify-center">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Chair book</p>
            <h2 className="mt-2 font-display text-4xl text-fg">{held ? "Held on the book." : offer.name}</h2>
            <p className="mt-2 text-sm text-muted">
              {held ? "The chair has the request. Nothing was charged." : `${offer.description} ${offer.price}.`}
            </p>
            {held ? null : (
              <form
                className="mt-6 grid gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  setHeld(true);
                }}
              >
                <label className="text-sm text-muted">
                  Name
                  <input
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-1 h-11 w-full rounded-xl bg-surface-2 px-3 text-fg"
                  />
                </label>
                <label className="text-sm text-muted">
                  Phone
                  <input
                    required
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="mt-1 h-11 w-full rounded-xl bg-surface-2 px-3 text-fg"
                  />
                </label>
                <button type="submit" className="barber-key is-primary h-12">
                  Confirm {offer.price}
                </button>
              </form>
            )}
            <div className="mt-4 flex gap-2">
              {bookHref && !held ? (
                <a href={bookHref} className="barber-key inline-flex h-11 items-center">
                  Open the book
                </a>
              ) : null}
              <button
                type="button"
                className="barber-key"
                onClick={() => {
                  setBooking(false);
                  setHeld(false);
                }}
              >
                {held ? "Return to the mirror" : "Dismiss"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
