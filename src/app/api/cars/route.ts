import { NextResponse, type NextRequest } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { parseCarsQuery } from "@/lib/cars-query";
import { queryCars } from "@/lib/cars-service";

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const query = parseCarsQuery(
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );
  const result = await queryCars(query);

  return NextResponse.json({
    items: result.items,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    },
  });
}
