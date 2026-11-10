import { createFileRoute, redirect } from "@tanstack/react-router";
import { INTENTS, type Intent } from "@/components/admin/cyber-stinger";

type CyberStingerSearch = { intent?: Intent };

/** Legacy public path — permanently redirects into the admin dashboard mount. */
export const Route = createFileRoute("/security/cyber-stinger")({
  validateSearch: (search: Record<string, unknown>): CyberStingerSearch => {
    const i = search.intent;
    return typeof i === "string" && (INTENTS as readonly string[]).includes(i)
      ? { intent: i as Intent }
      : {};
  },
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/admin/cyber-stinger",
      search: search.intent ? { intent: search.intent } : {},
      replace: true,
    });
  },
});
