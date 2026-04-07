import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";
import { runCarSensorScrape } from "@/lib/scraper";

export const runtime = "nodejs";
export const maxDuration = 300;

function isCronAuthorized(request: NextRequest): boolean {
  if (request.headers.get("x-vercel-cron")) {
    return true;
  }

  const secretFromQuery = request.nextUrl.searchParams.get("secret");
  const secretFromHeader = request.headers.get("x-cron-secret");

  return (
    secretFromQuery === config.cronSecret || secretFromHeader === config.cronSecret
  );
}

async function handle(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }

  const maxPages = Number.parseInt(
    request.nextUrl.searchParams.get("maxPages") ?? "1",
    10
  );
  const maxCars = Number.parseInt(
    request.nextUrl.searchParams.get("maxCars") ?? "25",
    10
  );

  const result = await runCarSensorScrape({
    maxPages: Number.isFinite(maxPages) ? maxPages : 1,
    maxCars: Number.isFinite(maxCars) ? maxCars : 25,
  });

  return NextResponse.json({ ok: true, result });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
