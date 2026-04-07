import "server-only";

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { config } from "@/lib/config";

export const AUTH_COOKIE_NAME = "carsensor_token";
const TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24h

export type AuthPayload = {
  sub: string;
  username: string;
};

type AuthUser = {
  id: string;
  username: string;
};

export function signAuthToken(user: AuthUser): string {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
    } satisfies AuthPayload,
    config.jwtSecret,
    { expiresIn: TOKEN_TTL_SECONDS }
  );
}

export function verifyAuthToken(token: string | null | undefined): AuthPayload | null {
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (!decoded || typeof decoded !== "object") {
      return null;
    }

    const payload = decoded as Partial<AuthPayload>;
    if (!payload.sub || !payload.username) {
      return null;
    }

    return {
      sub: payload.sub,
      username: payload.username,
    };
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const bearer = request.headers.get("authorization");
  if (bearer?.toLowerCase().startsWith("bearer ")) {
    return bearer.slice(7).trim();
  }

  return request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export function getAuthFromRequest(request: NextRequest): AuthPayload | null {
  const token = getTokenFromRequest(request);
  return verifyAuthToken(token);
}

export async function getAuthFromCookies(): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return verifyAuthToken(token);
}

export async function requireWebAuth(): Promise<AuthPayload> {
  const auth = await getAuthFromCookies();
  if (!auth) {
    redirect("/login");
  }

  return auth;
}
