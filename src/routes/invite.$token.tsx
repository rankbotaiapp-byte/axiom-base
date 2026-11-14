import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { claimInvite, getInvitePreview } from "@/lib/axiom/server";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/shop-chrome";

export const Route = createFileRoute("/invite/$token")({
  loader: async ({ params }) => {
    const preview = await getInvitePreview({ data: params.token });
    return { preview };
  },
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const { preview } = Route.useLoaderData();
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !preview) return;
    if (preview.invite_status === "claimed") {
      void navigate({ to: "/$shopSlug/employee", params: { shopSlug: preview.slug } });
    }
  }, [navigate, preview, user]);

  if (isPending) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <div className="h-10 w-40 animate-pulse rounded-full bg-fg/8" />
      </main>
    );
  }
  if (!user) return <RedirectToSignIn to="/login" next={`/invite/${token}`} />;
  if (!preview) {
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <Wordmark />
          <p className="mt-8 font-display text-3xl">This invite is no longer valid.</p>
          <Link to="/" className="mt-4 inline-block text-sm text-muted">
            Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-sm text-center">
        <Wordmark className="justify-center" />
        <h1 className="mt-8 font-display text-4xl leading-none">
          {preview.shop_name} invited {preview.display_name}.
        </h1>
        <p className="mt-3 text-sm text-muted">
          Claim this station and you'll land on your schedule — no PIN, no shared login.
        </p>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        <Button
          className="mt-6 w-full"
          size="lg"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void claimInvite({ data: token })
              .then((r) => navigate({ to: "/$shopSlug/employee", params: { shopSlug: r.slug } }))
              .catch((e: unknown) => {
                setError(e instanceof Error ? e.message : "Could not claim");
                setBusy(false);
              });
          }}
        >
          Claim station
        </Button>
      </div>
    </main>
  );
}
