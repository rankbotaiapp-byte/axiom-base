import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-center text-fg">
      <div>
        <p className="font-display text-3xl">Page not found.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-muted">
          Back to Axiom
        </Link>
      </div>
    </main>
  );
}
