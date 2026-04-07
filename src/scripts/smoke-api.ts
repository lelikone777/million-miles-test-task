import "dotenv/config";

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[SMOKE] ${message}`);
  }
}

function extractCookie(headers: Headers, cookieName: string): string | null {
  const extended = headers as Headers & { getSetCookie?: () => string[] };
  const setCookies =
    typeof extended.getSetCookie === "function"
      ? extended.getSetCookie()
      : headers.get("set-cookie")
        ? [headers.get("set-cookie") as string]
        : [];

  for (const row of setCookies) {
    const first = row.split(";")[0]?.trim();
    if (first?.startsWith(`${cookieName}=`)) {
      return first;
    }
  }

  return null;
}

async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${path}`, init);
  return response;
}

async function main() {
  console.log(`[SMOKE] base url: ${BASE_URL}`);

  const unauthorizedCars = await request("/api/cars");
  assert(unauthorizedCars.status === 401, "GET /api/cars without auth must return 401");
  console.log("[SMOKE] unauthorized /api/cars: ok");

  const loginResponse = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    }),
  });
  assert(loginResponse.ok, `POST /api/auth/login failed: ${loginResponse.status}`);
  const loginBody = (await loginResponse.json()) as {
    token?: string;
    user?: { id: string; username: string };
  };
  assert(loginBody.user?.username === ADMIN_USERNAME, "login response username mismatch");
  assert(typeof loginBody.token === "string" && loginBody.token.length > 20, "JWT token missing");
  console.log("[SMOKE] login: ok");

  const authCookie = extractCookie(loginResponse.headers, "carsensor_token");
  assert(authCookie, "auth cookie not found in login response");

  const meResponse = await request("/api/auth/me", {
    headers: {
      cookie: authCookie,
    },
  });
  assert(meResponse.ok, `GET /api/auth/me failed: ${meResponse.status}`);
  const meBody = (await meResponse.json()) as { user?: { username?: string } };
  assert(meBody.user?.username === ADMIN_USERNAME, "me response username mismatch");
  console.log("[SMOKE] /api/auth/me: ok");

  const carsResponse = await request("/api/cars?limit=5&page=1&sort=newest", {
    headers: {
      cookie: authCookie,
      authorization: `Bearer ${loginBody.token}`,
    },
  });
  assert(carsResponse.ok, `GET /api/cars failed: ${carsResponse.status}`);
  const carsBody = (await carsResponse.json()) as {
    items?: Array<{ id: string }>;
    meta?: { total: number };
  };
  assert(Array.isArray(carsBody.items), "/api/cars items must be array");
  assert(carsBody.meta && typeof carsBody.meta.total === "number", "/api/cars meta.total missing");
  console.log("[SMOKE] /api/cars: ok");

  if ((carsBody.items?.length ?? 0) > 0) {
    const firstId = carsBody.items?.[0]?.id;
    assert(firstId, "first car id missing");
    const carResponse = await request(`/api/cars/${firstId}`, {
      headers: {
        cookie: authCookie,
      },
    });
    assert(carResponse.ok, `GET /api/cars/:id failed: ${carResponse.status}`);
    console.log("[SMOKE] /api/cars/:id: ok");
  } else {
    console.log("[SMOKE] /api/cars/:id: skipped (no data)");
  }

  const logoutResponse = await request("/api/auth/logout", {
    method: "POST",
    headers: {
      cookie: authCookie,
    },
  });
  assert(logoutResponse.ok, `POST /api/auth/logout failed: ${logoutResponse.status}`);
  console.log("[SMOKE] logout: ok");

  console.log("[SMOKE] all checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

