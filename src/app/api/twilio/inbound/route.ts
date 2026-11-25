import { POST as handleInbound } from "@/app/api/webhooks/twilio/sms/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleInbound(request);
}
