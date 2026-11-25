/** Inspect DATABASE_URL without exposing credentials. */

export class DatabaseConfigError extends Error {
  readonly code = "DB_CONFIG";
  readonly status = 503;
  constructor(message = "Database is unavailable") {
    super(message);
    this.name = "DatabaseConfigError";
  }
}

export type DatabaseUrlInspection = {
  set: boolean;
  protocolOk: boolean;
  parseOk: boolean;
  placeholderHost: boolean;
  loopbackHost: boolean;
  cloudRisk: boolean;
};

const PLACEHOLDER_HOSTS = new Set(["db.example.com", "example.com", "your-db-host", "changeme"]);

function productionLike(): boolean {
  return process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
}

export function inspectDatabaseUrl(
  raw: string | undefined | null,
  opts: { production?: boolean } = {},
): DatabaseUrlInspection {
  const value = String(raw ?? "").trim();
  const production = opts.production ?? productionLike();
  if (!value) {
    return {
      set: false,
      protocolOk: false,
      parseOk: false,
      placeholderHost: false,
      loopbackHost: false,
      cloudRisk: false,
    };
  }
  const protocolOk = /^postgres(ql)?:\/\//i.test(value);
  let hostname = "";
  let parseOk = false;
  try {
    const normalized = value.replace(/^postgres:\/\//i, "postgresql://");
    hostname = new URL(normalized).hostname.toLowerCase();
    parseOk = hostname.length > 0;
  } catch {
    parseOk = false;
  }
  const loopbackHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  const placeholderHost = PLACEHOLDER_HOSTS.has(hostname);
  return {
    set: true,
    protocolOk,
    parseOk,
    placeholderHost,
    loopbackHost,
    cloudRisk: production && (loopbackHost || placeholderHost || !protocolOk || !parseOk),
  };
}

export function databaseUrlUsable(raw: string | undefined | null): boolean {
  const report = inspectDatabaseUrl(raw, { production: false });
  return report.set && report.protocolOk && report.parseOk && !report.placeholderHost;
}

export function isDatabaseConfigFailure(err: unknown): boolean {
  return err instanceof DatabaseConfigError;
}
