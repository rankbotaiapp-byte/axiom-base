"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarClock, Check, PhoneIncoming, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { listAppointmentRequests, reviewAppointmentRequest } from "@/lib/axiom/server";
import { readMasterTelemetry } from "@/lib/axiom/hero-films";
import type { AppointmentRequest, Employee, Service } from "@/lib/axiom/types";

type Draft = {
  employeeId: string;
  serviceId: string;
  startsAt: string;
};

export function ConciergeDesk({
  slug,
  employees,
  services,
  readonly,
}: {
  slug: string;
  employees: Employee[];
  services: Service[];
  readonly: boolean;
}) {
  const reduce = useReducedMotion();
  const [rows, setRows] = useState<AppointmentRequest[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<string[]>([]);

  const load = () => {
    void listAppointmentRequests({ data: { slug } })
      .then((next) => {
        setRows(next);
        setDrafts((prev) => {
          const merged = { ...prev };
          for (const row of next) {
            if (merged[row.id]) continue;
            merged[row.id] = {
              employeeId: employees[0]?.id ?? "",
              serviceId: matchService(row.requestedService, services)?.id ?? services[0]?.id ?? "",
              startsAt: defaultSlot(),
            };
          }
          return merged;
        });
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    load();
    const tick = window.setInterval(load, 8000);
    return () => window.clearInterval(tick);
  }, [slug]);

  useEffect(() => {
    const read = () => setTelemetry(readMasterTelemetry());
    read();
    const tick = window.setInterval(read, 4000);
    return () => window.clearInterval(tick);
  }, []);

  const stats = useMemo(() => {
    const incoming = rows.filter((row) => row.status === "new").length;
    const booked = rows.filter((row) => row.status === "booked").length;
    const closed = rows.filter((row) => row.status === "closed").length;
    return { incoming, booked, closed, total: rows.length };
  }, [rows]);

  const act = async (
    row: AppointmentRequest,
    status: "reviewed" | "booked" | "closed",
  ) => {
    if (readonly) return;
    setBusyId(row.id);
    setError(null);
    const draft = drafts[row.id];
    try {
      await reviewAppointmentRequest({
        data: {
          slug,
          id: row.id,
          status,
          employeeId: draft?.employeeId,
          serviceId: draft?.serviceId,
          startsAt: draft?.startsAt ? new Date(draft.startsAt).toISOString() : undefined,
        },
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update that request.");
    } finally {
      setBusyId(null);
    }
  };

  const fade = reduce ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <motion.section
      initial={{ opacity: 0, y: reduce ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fade}
      className="glass-panel mb-6 overflow-hidden rounded-[1.5rem] p-5 md:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">AI concierge</p>
          <h2 className="mt-1 font-display text-2xl tracking-tight text-fg">Incoming voice requests</h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
            Live asks captured after a call. Review them, park a time on the book, or close the thread.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Waiting" value={String(stats.incoming)} />
        <Metric label="On the book" value={String(stats.booked)} />
        <Metric label="Closed" value={String(stats.closed)} />
        <Metric label="Captured" value={String(stats.total)} />
      </div>

      {telemetry.length > 0 ? (
        <ul className="mt-4 grid gap-1 font-mono text-xs text-muted">
          {telemetry.map((line) => (
            <li key={line} className="truncate">
              GPU · {line}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 font-mono text-xs text-faint">Telemetry quiet — hero loop idle.</p>
      )}

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      <AnimatePresence initial={false}>
        {rows.length === 0 ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-5 text-sm text-faint"
          >
            No voice requests yet. When the concierge finishes a call, it lands here.
          </motion.p>
        ) : (
          <ul className="mt-5 grid gap-3">
            {rows.map((row) => {
              const draft = drafts[row.id];
              const open = row.status === "new" || row.status === "reviewed";
              return (
                <motion.li
                  key={row.id}
                  layout
                  initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-2xl p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-medium text-fg">
                        <PhoneIncoming className="size-4 shrink-0 text-accent" aria-hidden />
                        {row.callerName || "Guest"}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {row.requestedService || "Service not named"}
                        {row.callerPhone ? ` · ${row.callerPhone}` : ""}
                      </p>
                      <p className="mt-1 font-mono text-xs uppercase tracking-wider text-faint">
                        {row.status} ·{" "}
                        {new Date(row.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  {row.transcript ? (
                    <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted">{row.transcript}</p>
                  ) : null}
                  {open && !readonly && draft ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div>
                        <Label htmlFor={`emp-${row.id}`}>Chair</Label>
                        <select
                          id={`emp-${row.id}`}
                          className="h-11 w-full rounded-xl bg-surface-2/80 px-3.5 text-sm text-fg"
                          value={draft.employeeId}
                          onChange={(event) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [row.id]: { ...draft, employeeId: event.target.value },
                            }))
                          }
                        >
                          {employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {employee.displayName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor={`svc-${row.id}`}>Service</Label>
                        <select
                          id={`svc-${row.id}`}
                          className="h-11 w-full rounded-xl bg-surface-2/80 px-3.5 text-sm text-fg"
                          value={draft.serviceId}
                          onChange={(event) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [row.id]: { ...draft, serviceId: event.target.value },
                            }))
                          }
                        >
                          {services.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor={`when-${row.id}`}>Time</Label>
                        <Input
                          id={`when-${row.id}`}
                          type="datetime-local"
                          value={draft.startsAt}
                          onChange={(event) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [row.id]: { ...draft, startsAt: event.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>
                  ) : null}
                  {open && !readonly ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="accent"
                        className="min-h-11"
                        disabled={busyId === row.id || !employees.length || !services.length}
                        onClick={() => void act(row, "booked")}
                      >
                        <CalendarClock className="size-4" aria-hidden />
                        Schedule
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="min-h-11"
                        disabled={busyId === row.id}
                        onClick={() => void act(row, "reviewed")}
                      >
                        <Check className="size-4" aria-hidden />
                        Mark reviewed
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="min-h-11"
                        disabled={busyId === row.id}
                        onClick={() => void act(row, "closed")}
                      >
                        <X className="size-4" aria-hidden />
                        Close
                      </Button>
                    </div>
                  ) : null}
                </motion.li>
              );
            })}
          </ul>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl px-4 py-3">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl text-fg">{value}</p>
    </div>
  );
}

function matchService(requested: string, services: Service[]) {
  const query = requested.trim().toLowerCase();
  if (!query) return services[0];
  return (
    services.find((service) => service.name.toLowerCase() === query) ??
    services.find((service) => query.includes(service.name.toLowerCase()) || service.name.toLowerCase().includes(query)) ??
    services[0]
  );
}

function defaultSlot() {
  const when = new Date();
  when.setDate(when.getDate() + 1);
  when.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}T${pad(when.getHours())}:${pad(when.getMinutes())}`;
}
