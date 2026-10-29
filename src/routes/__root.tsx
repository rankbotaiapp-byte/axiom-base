import { createServerFn } from "@tanstack/react-start";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { isClientAbort } from "@/lib/client-abort";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Toaster } from "sonner";
import { AvatarHelpButton } from "@/components/avatar-help";
import { FluidField } from "@/components/fluid-field";
import { InterfaceAudio } from "@/components/interface-audio";
import appCss from "../styles.css?url";

const APP_NAME = "New Era Apps";

const fetchSessionUser = createServerFn({ method: "GET" }).handler(async () => {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const u = await getSessionUser();
  return u ? { id: u.id, email: u.email } : null;
});

export const Route = createRootRoute({
  beforeLoad: async () => {
    try {
      return { sessionUser: await fetchSessionUser() };
    } catch (error) {
      if (isClientAbort(error)) return { sessionUser: null };
      throw error;
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content: "Instant booking sites for local service businesses. Powered by Axiom.",
      },
      { name: "theme-color", content: "#08080A" },
    ],
    links: [
      { rel: "icon", type: "image/png", sizes: "180x180", href: "/icon-180-png.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/icon-180-png.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fira+Code:wght@450;500;600&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  notFoundComponent: () => (
    <main className="neon-shell grid min-h-dvh place-items-center px-6 text-center text-fg">
      <div className="glass-card reveal-up rounded-2xl px-8 py-10">
        <p className="font-display text-3xl">Page not found.</p>
        <a href="/" className="mt-4 inline-block text-sm text-muted">
          Back to Axiom
        </a>
      </div>
    </main>
  ),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" className="dark antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-transparent font-sans text-fg antialiased">
        <FluidField />
        <div className="relative z-10">
          <PreviewHostBridge />
          <AuthProvider>
            <Outlet />
          </AuthProvider>
          <AvatarHelpButton />
          <InterfaceAudio />
          <Toaster theme="dark" position="top-center" />
        </div>
        <Scripts />
      </body>
    </html>
  );
}
