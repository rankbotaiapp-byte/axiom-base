import { useCallback, useState } from "react";
import { ensureFunnelSession } from "@/lib/axiom/master";
import { startTenantStorefrontCheckout } from "@/lib/axiom/tenant-billing.functions";
import {
  describePlumbingCheckoutError,
  plumbingCheckoutLeadSlug,
  plumbingCheckoutRedirect,
  plumbingCheckoutSlugFromPath,
  PLUMBING_CHECKOUT_IDLE,
  type PlumbingCheckoutPlan,
  type PlumbingCheckoutState,
} from "@/lib/axiom/plumbing-checkout";

export function usePlumbingCheckout(leadSlug: string) {
  const [state, setState] = useState<PlumbingCheckoutState>(PLUMBING_CHECKOUT_IDLE);

  const start = useCallback(
    async (plan: PlumbingCheckoutPlan) => {
      const boundSlug = plumbingCheckoutLeadSlug(
        leadSlug,
        typeof window !== "undefined" ? plumbingCheckoutSlugFromPath(window.location.pathname) : "",
      );
      if (!boundSlug) {
        setState({
          busy: false,
          redirecting: false,
          error: "This storefront is missing its territory slug.",
          plan,
        });
        return;
      }
      setState({ busy: true, redirecting: false, error: null, plan });
      try {
        await ensureFunnelSession().catch(() => undefined);
        const started = await startTenantStorefrontCheckout({
          data: {
            leadSlug: boundSlug,
            planId: plan,
            ...(plan === "trial" ? { namedPriceDollars: "1" } : {}),
          },
        });
        const url = plumbingCheckoutRedirect(started);
        setState({ busy: true, redirecting: true, error: null, plan });
        window.location.assign(url);
      } catch (err) {
        setState({
          busy: false,
          redirecting: false,
          error: describePlumbingCheckoutError(err),
          plan,
        });
      }
    },
    [leadSlug],
  );

  return {
    ...state,
    onTrial: () => start("trial"),
    onLifetime: () => start("lifetime"),
  };
}
