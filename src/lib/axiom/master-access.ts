export function verifyMasterAccess(_token?: string) {
  return true;
}

export function getMasterPermissions() {
  return ["read", "write", "deploy", "override"];
}

/** Middleware stub for leftover TanStack createServerFn chains. */
export const masterAccessMiddleware = {
  server: async <T>(ctx: { next: () => Promise<T> }) => ctx.next(),
};

export default verifyMasterAccess;
