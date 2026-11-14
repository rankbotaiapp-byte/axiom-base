import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { ShopNiche } from "@/lib/axiom/types";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function GuestBookDialog({
  open,
  niche,
  shopName,
  onClose,
}: {
  open: boolean;
  niche: ShopNiche | string;
  shopName: string;
  claimHref: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [when, setWhen] = useState("");
  const [sent, setSent] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-bg/80 px-5" role="dialog" aria-modal="true" aria-labelledby="guest-book-title">
      <div className="w-full max-w-md rounded-[28px] bg-surface p-6 shadow-[0_0_0_1px_rgba(243,241,235,0.1)]">
        {sent ? (
          <>
            <p id="guest-book-title" className="font-display text-3xl">
              Request saved
            </p>
            <p className="mt-3 text-sm text-muted">
              {shopName} has your time. This preview does not charge a card.
            </p>
            <button type="button" className="mt-6 inline-flex h-11 items-center rounded-xl bg-fg px-4 text-sm text-bg" onClick={onClose}>
              Close
            </button>
          </>
        ) : (
          <>
            <p id="guest-book-title" className="font-display text-3xl">
              Book {shopName}
            </p>
            <p className="mt-2 text-sm text-muted">Leave a name and a time. Owners claim this page separately.</p>
            <form
              className="mt-5 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!name.trim()) return;
                setSent(true);
              }}
            >
              <div>
                <Label htmlFor="guest-name">Your name</Label>
                <Input id="guest-name" value={name} onChange={(event) => setName(event.target.value)} required />
              </div>
              <div>
                <Label htmlFor="guest-phone">Phone</Label>
                <Input id="guest-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </div>
              <div>
                <Label htmlFor="guest-when">Preferred time</Label>
                <Input id="guest-when" value={when} onChange={(event) => setWhen(event.target.value)} placeholder="Friday morning" />
              </div>
              <Button type="submit" className="mt-2 w-full" size="lg">
                Request this slot
              </Button>
            </form>
            <p className="mt-5 text-sm text-muted">
              Run a shop like this?{" "}
              <Link to="/onboard" search={{ niche: niche as ShopNiche }} className="text-fg underline-offset-4 hover:underline">
                Use this as my shop
              </Link>
            </p>
            <button type="button" className="mt-4 text-sm text-muted hover:text-fg" onClick={onClose}>
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
