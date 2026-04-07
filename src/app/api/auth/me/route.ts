import { NextResponse, type NextRequest } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: auth.sub,
      username: auth.username,
    },
  });
}
