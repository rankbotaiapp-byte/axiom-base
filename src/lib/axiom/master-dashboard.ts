export type ServerStatus = "optimal" | "degraded" | "down";

export type StateLeadCount = {
  state: string;
  count: number;
};

export type MasterTelemetry = {
  activeTenants: number;
  totalLeads: number;
  leadsLast24h: number;
  leadsByState: StateLeadCount[];
  activeVapiCalls: number;
  server: {
    status: ServerStatus;
    cpuPercent: number;
    memoryPercent: number;
    p95LatencyMs: number;
    uptimeSeconds: number;
  };
  updatedAt: string;
};

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "unpaid";

export type MasterTenant = {
  id: string;
  name: string;
  slug: string;
  niche: string;
  heroLoop: string;
  leadCount: number;
  plan: string;
  mrrCents: number;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId: string;
  currentPeriodEnd: string | null;
  lastWebhookAt: string | null;
};

export type TenantsResponse = {
  tenants: MasterTenant[];
};

export type AutopilotState = "idle" | "running" | "paused" | "error";
export type AutopilotAction = "start" | "pause" | "run_batch" | "automate" | "tick_content";
export type LogLevel = "info" | "success" | "warn" | "error";
export type Channel = "sms" | "email" | "system";

export type ChannelStats = {
  sent: number;
  delivered: number;
  failed: number;
  inFlight: number;
  healthy: boolean;
  lastEventAt: string | null;
};

export type AutopilotLog = {
  id: string;
  at: string;
  level: LogLevel;
  channel: Channel;
  message: string;
};

export type AutopilotStatus = {
  state: AutopilotState;
  currentBatchId: string | null;
  queued: number;
  sentToday: number;
  sms: ChannelStats;
  email: ChannelStats;
  logs: AutopilotLog[];
};

export function parseSubscriptionStatus(value: string | null | undefined): SubscriptionStatus {
  const raw = (value ?? "").trim().toLowerCase().replace(/-/g, "_");
  if (raw === "active") return "active";
  if (raw === "trialing" || raw === "trial") return "trialing";
  if (raw === "past_due" || raw === "pastdue") return "past_due";
  if (raw === "canceled" || raw === "cancelled") return "canceled";
  if (raw === "unpaid") return "unpaid";
  return "incomplete";
}

export function logLevelFromStatus(status: string): LogLevel {
  const raw = status.toLowerCase();
  if (raw === "failed" || raw === "error") return "error";
  if (raw === "sent" || raw === "logged" || raw === "success") return "success";
  if (raw === "paused" || raw === "warn") return "warn";
  return "info";
}

export function channelFromLog(value: string): Channel {
  if (value === "sms" || value === "email") return value;
  return "system";
}

export function emptyChannelStats(): ChannelStats {
  return { sent: 0, delivered: 0, failed: 0, inFlight: 0, healthy: true, lastEventAt: null };
}
