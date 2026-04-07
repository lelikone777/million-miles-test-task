import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { signAuthToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { config } from "@/lib/config";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = loginSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректный запрос. Ожидаются поля username и password." },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;

    let user = await prisma.user.findUnique({
      where: { username },
    });

    if (
      !user &&
      username === config.adminUsername &&
      password === config.adminPassword
    ) {
      user = await prisma.user.create({
        data: {
          username: config.adminUsername,
          passwordHash: await bcrypt.hash(config.adminPassword, 10),
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Неверный логин или пароль" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Неверный логин или пароль" },
        { status: 401 }
      );
    }

    const token = signAuthToken(user);
    const response = NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Ошибка при выполнении входа" }, { status: 500 });
  }
}
