import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Layout only — `/onboard` index and `/onboard/success` render through here. Success must stay public (paid Stripe session is the credential). */
export const Route = createFileRoute("/onboard")({
  component: OnboardLayout,
});

function OnboardLayout() {
  return <Outlet />;
}
