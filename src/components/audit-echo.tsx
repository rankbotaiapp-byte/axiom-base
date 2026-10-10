import { useEffect, useState } from "react";
import { getAuditStatus } from "@/lib/axiom/server";
import { pulseHaptic } from "@/lib/axiom/feedback";

export function AuditEcho() {
  const [detail, setDetail] = useState("");
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const id = sessionStorage.getItem("axiom:audit-watch");
    if (!id) return;
    let stop = false;
    const tick = () => {
      void getAuditStatus({ data: id })
        .then((status) => {
          if (stop || status.status !== "confirmed" || !status.detail) return;
          sessionStorage.removeItem("axiom:audit-watch");
          setDetail(status.detail);
          setFlash(true);
          pulseHaptic("confirm");
          window.setTimeout(() => setFlash(false), 1600);
        })
        .catch(() => undefined);
    };
    tick();
    const timer = window.setInterval(tick, 1200);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, []);

  if (!detail && !flash) return null;
  return (
    <>
      {flash ? <div className="axiom-ring" data-state="lock" aria-hidden="true" /> : null}
      {detail ? (
        <div className="mb-6 rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(46,230,214,0.45)]">
          <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Locked in</p>
          <p className="mt-2 text-sm">{detail}</p>
        </div>
      ) : null}
    </>
  );
}
