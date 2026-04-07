import { NextResponse, type NextRequest } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getCarById } from "@/lib/cars-service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const { id } = await context.params;
  const car = await getCarById(id);
  if (!car) {
    return NextResponse.json({ error: "Автомобиль не найден" }, { status: 404 });
  }

  return NextResponse.json(car);
}
