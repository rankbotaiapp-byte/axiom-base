/**
 * Connection failures that mean the hosted database cannot be reached.
 * Schema and query errors stay fatal. XX000 is only treated as offline when
 * the pooler says the authentication query could not reach Postgres.
 */
export function isDatabaseUnavailable(err) {
  const seen = new Set();

  function matches(code, message) {
    if (
      code === "57P01" ||
      code === "57P03" ||
      code === "08000" ||
      code === "08001" ||
      code === "08003" ||
      code === "08004" ||
      code === "08006" ||
      code === "08007" ||
      code === "53300" ||
      // Hosted primary / replica answering read-only — cannot migrate locally.
      code === "25006" ||
      code === "ENOTFOUND" ||
      code === "EAI_AGAIN" ||
      code === "ECONNRESET" ||
      code === "ECONNREFUSED" ||
      code === "ETIMEDOUT" ||
      code === "EHOSTUNREACH" ||
      code === "ENETUNREACH"
    ) {
      return true;
    }
    if (
      code === "XX000" &&
      /EAUTHQUERY|authentication query failed|connection to database not available/i.test(message)
    ) {
      return true;
    }
    return /EAUTHQUERY|connection to database not available|the database system is not accepting connections|Hosted Postgres is not accepting connections|hot standby mode is disabled|cannot execute .+ in a read-only transaction|read-only transaction|connection terminated|timeout expired|ECONNREFUSED|ENOTFOUND|ECONNRESET|getaddrinfo/i.test(
      message,
    );
  }

  function walk(value, depth) {
    if (value == null || depth > 4 || seen.has(value)) return false;
    if (typeof value === "object") seen.add(value);
    const message = value instanceof Error ? value.message : typeof value === "string" ? value : "";
    const code =
      value && typeof value === "object" && "code" in value ? String(value.code ?? "") : "";
    if (matches(code, message)) return true;
    if (value && typeof value === "object") {
      if ("cause" in value && walk(value.cause, depth + 1)) return true;
      if (Array.isArray(value.errors) && value.errors.some((item) => walk(item, depth + 1))) return true;
    }
    return false;
  }

  return walk(err, 0);
}
