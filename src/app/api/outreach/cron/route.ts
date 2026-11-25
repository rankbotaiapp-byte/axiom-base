import { handleOutreachCron } from "@/lib/axiom/outreach-cron.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleOutreachCron(request);
}

export async function GET(request: Request) {
  return handleOutreachCron(request);
}
