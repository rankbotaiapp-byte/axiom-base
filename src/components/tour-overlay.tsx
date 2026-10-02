import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export function TourOverlay({ slug }: { slug: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
    >
      <div className="pointer-events-auto w-full max-w-md rounded-2xl bg-surface/95 p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.1)]">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Guided loop · 1 of 3</p>
        <p className="mt-2 font-display text-2xl leading-tight">This page is already live.</p>
        <p className="mt-2 text-sm text-muted">
          Dummy staff, services, and a hero are in. Open Admin to put your face on it, then book a test chair.
        </p>
        <Link
          to="/$shopSlug/admin"
          params={{ shopSlug: slug }}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-fg text-sm font-medium text-bg"
        >
          Open Admin
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </motion.div>
  );
}

export function LoopOverlay({ slug, employeeId }: { slug: string; employeeId?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
    >
      <div className="pointer-events-auto w-full max-w-md rounded-2xl bg-surface/95 p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.1)]">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Guided loop · book a test</p>
        <p className="mt-2 font-display text-2xl leading-tight">Close the loop.</p>
        <p className="mt-2 text-sm text-muted">
          Book with the person you just invited. Pay with Gear Guardian (mock). Watch the edge light.
        </p>
        <Link
          to="/$shopSlug/book"
          params={{ shopSlug: slug }}
          search={employeeId ? { employee: employeeId } : {}}
          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl bg-fg text-sm font-medium text-bg"
        >
          Book a test appointment
        </Link>
      </div>
    </motion.div>
  );
}
