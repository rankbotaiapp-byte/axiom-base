/** Browser-safe studio job helpers — never import `@/lib/db` from client components. */

export async function saveHeroStudioJob(input: {
  data: {
    slug: string;
    mode?: "manual" | "autopilot";
    effectId: string;
    brandMark?: string;
    loopUrl: string;
    logoUrl?: string;
  };
}) {
  const response = await fetch("/api/studio/jobs", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input.data),
  });
  const body = (await response.json()) as { error?: string; id?: string; saved?: boolean };
  if (!response.ok) throw new Error(body.error || "Studio job failed");
  return body;
}

export async function listHeroStudioJobs(input: { data: { slug: string } }) {
  const response = await fetch(`/api/studio/jobs?slug=${encodeURIComponent(input.data.slug)}`, {
    credentials: "include",
  });
  const body = (await response.json()) as { jobs?: unknown[]; error?: string };
  if (!response.ok) throw new Error(body.error || "Studio jobs failed");
  return body.jobs ?? [];
}
