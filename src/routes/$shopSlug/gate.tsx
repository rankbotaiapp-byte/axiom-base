import { createFileRoute } from "@tanstack/react-router";
import { BiometricAuthGateway } from "@/components/biometric-auth-gateway";

export const Route = createFileRoute("/$shopSlug/gate")({
  component: ShopGate,
});

function ShopGate() {
  const { shopSlug } = Route.useParams();
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-5 py-10">
      <BiometricAuthGateway shopSlug={shopSlug} />
    </main>
  );
}
