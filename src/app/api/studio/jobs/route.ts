import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      slug: string;
      mode?: "manual" | "autopilot";
      effectId: string;
      brandMark?: string;
      loopUrl: string;
      logoUrl?: string;
    };
    const { saveHeroStudioJob } = await import("@/lib/actions/studio-actions");
    const result = await saveHeroStudioJob({ data: body });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Studio job failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get("slug") || "";
    const { listHeroStudioJobs } = await import("@/lib/actions/studio-actions");
    const rows = await listHeroStudioJobs({ data: { slug } });
    return NextResponse.json({ jobs: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Studio jobs failed";
    return NextResponse.json({ error: message, jobs: [] }, { status: 400 });
  }
}
