import { Link } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { nicheCopy } from "@/lib/axiom/niches";
import type { AccessMode, Shop } from "@/lib/axiom/types";
import { cn } from "@/lib/utils";
import { IntroFxToggle } from "@/components/cinematic-hero";

export function ShopNav({
  shop,
  mode,
  highlightAdmin,
}: {
  shop: Shop;
  mode: AccessMode;
  highlightAdmin?: boolean;
}) {
  const { user } = useCurrentUserState();
  const copy = nicheCopy(shop.niche);
  return (
    <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
      <Link
        to="/$shopSlug"
        params={{ shopSlug: shop.slug }}
        className="min-w-0"
      >
        <p className="truncate text-[11px] uppercase tracking-[0.22em] text-muted">
          New Era Apps · Powered by Axiom
        </p>
        <p className="truncate font-display text-xl leading-tight text-fg">{shop.name}</p>
      </Link>
      <nav className="flex items-center gap-1 sm:gap-2">
        <IntroFxToggle className="hidden sm:inline-flex" />
        <Link
          to="/$shopSlug/book"
          params={{ shopSlug: shop.slug }}
          className="hidden h-11 items-center rounded-xl px-3 text-sm text-muted transition-[color] duration-150 hover:text-fg sm:inline-flex"
        >
          {copy.bookLabel}
        </Link>
        {mode === "owner" || mode === "preview" || highlightAdmin ? (
          <Link
            id="tour-admin"
            to="/$shopSlug/admin"
            params={{ shopSlug: shop.slug }}
            className={cn(
              "inline-flex h-11 items-center rounded-xl px-3 text-sm transition-[color,box-shadow] duration-150",
              highlightAdmin
                ? "text-fg shadow-[0_0_0_1px_var(--ring-color),0_0_24px_color-mix(in_srgb,var(--ring-color)_45%,transparent)]"
                : "text-muted hover:text-fg",
            )}
          >
            Admin
          </Link>
        ) : null}
        {mode === "employee" ? (
          <Link
            to="/$shopSlug/employee"
            params={{ shopSlug: shop.slug }}
            className="inline-flex h-11 items-center rounded-xl px-3 text-sm text-muted hover:text-fg"
          >
            Station
          </Link>
        ) : null}
        <div className="hidden sm:block">
          {user ? (
            <UserButton />
          ) : (
            <Link to="/login" className="inline-flex h-11 items-center px-3 text-sm text-muted hover:text-fg">
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2", className)}>
      <span className="grid size-7 place-items-center rounded-full shadow-[0_0_0_1px_rgba(243,241,235,0.16)]">
        <span className="size-2 rounded-full bg-accent" />
      </span>
      <span className="font-display text-lg tracking-tight">Axiom</span>
    </Link>
  );
}

export function PoweredBy({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "px-5 py-10 text-center text-[11px] uppercase tracking-[0.22em] text-faint",
        className,
      )}
    >
      New Era Apps · Powered by Axiom
    </p>
  );
}
