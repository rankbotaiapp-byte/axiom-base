"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { AxiomVideoBookingModal } from "@/components/conversion/AxiomVideoBookingModal";
import type { InstantQuoteSelection } from "@/lib/axiom/instant-quote-catalog";
import { resolveStorefrontTheme, themeCssVars, type StorefrontThemeId } from "@/lib/axiom/storefront-themes";
import "@/components/studio/obsidian-hud-studio.css";
import "./storefront-conversion.css";

type StorefrontBookingContextValue = {
  openVideoBooking: (context?: InstantQuoteSelection | "emergency") => void;
};

const StorefrontBookingContext = createContext<StorefrontBookingContextValue | null>(null);

export function useStorefrontBooking() {
  const ctx = useContext(StorefrontBookingContext);
  if (!ctx) throw new Error("useStorefrontBooking must be used within StorefrontBookingHost");
  return ctx;
}

export function useStorefrontBookingOptional() {
  return useContext(StorefrontBookingContext);
}

export function StorefrontBookingHost({
  shopSlug,
  shopName,
  bookPath,
  themeId = "cyber_cyan",
  brandStyle,
  children,
}: {
  shopSlug: string;
  shopName: string;
  bookPath: string;
  themeId?: StorefrontThemeId | string;
  brandStyle?: CSSProperties;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [quoteContext, setQuoteContext] = useState<InstantQuoteSelection | null>(null);
  const [emergency, setEmergency] = useState(false);

  const style = useMemo(
    () => ({ ...themeCssVars(resolveStorefrontTheme(themeId)), ...brandStyle }) as CSSProperties,
    [themeId, brandStyle],
  );

  const openVideoBooking = useCallback((context?: InstantQuoteSelection | "emergency") => {
    if (context === "emergency") {
      setEmergency(true);
      setQuoteContext(null);
    } else if (context) {
      setEmergency(false);
      setQuoteContext(context);
    } else {
      setEmergency(false);
      setQuoteContext(null);
    }
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openVideoBooking }), [openVideoBooking]);

  return (
    <StorefrontBookingContext.Provider value={value}>
      <div className="storefront-cro-root" style={style}>
        {children}
        <AxiomVideoBookingModal
          open={open}
          onClose={() => setOpen(false)}
          shopSlug={shopSlug}
          shopName={shopName}
          bookPath={bookPath}
          quote={quoteContext}
          emergency={emergency}
        />
      </div>
    </StorefrontBookingContext.Provider>
  );
}