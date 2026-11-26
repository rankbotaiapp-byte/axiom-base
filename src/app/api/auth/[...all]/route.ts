import { handleAuthRequest } from "@/lib/auth/auth-route-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: Request): Promise<Response> {
  return handleAuthRequest(request, async () => {
    const { auth } = await import("@/lib/auth/server");
    return await auth.handler(request);
  });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
