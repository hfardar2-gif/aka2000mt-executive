import { createFileRoute } from "@tanstack/react-router";

const COOKIE_NAME = "aka_app_session";
const SESSION_SECONDS = 60 * 60 * 12;

type AuthRequest = {
  action?: "login" | "logout";
  password?: unknown;
};

const jsonError = (message: string, status: number) =>
  Response.json({ ok: false, authenticated: false, message }, { status });

const parseCookies = (header: string | null) => {
  const cookies: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
};

const digest = async (value: string) => {
  const bytes = new TextEncoder().encode(`aka-dashboard-session:${value}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const sessionCookie = (value: string, maxAge: number) =>
  `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

const configuredPassword = () => process.env.DATA_ENTRY_PASSWORD;

const isAuthenticated = async (request: Request, password: string) => {
  const expected = await digest(password);
  const actual = parseCookies(request.headers.get("cookie"))[COOKIE_NAME];
  return typeof actual === "string" && actual.length === expected.length && actual === expected;
};

export const Route = createFileRoute("/api/app-auth")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const password = configuredPassword();
        if (!password) return jsonError("Application password is not configured.", 500);
        const authenticated = await isAuthenticated(request, password);
        return Response.json({ ok: true, authenticated });
      },
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        if (origin && origin !== new URL(request.url).origin) {
          return jsonError("Cross-origin requests are not allowed.", 403);
        }

        let body: AuthRequest;
        try {
          body = (await request.json()) as AuthRequest;
        } catch {
          return jsonError("Invalid request.", 400);
        }

        if (body.action === "logout") {
          return Response.json(
            { ok: true, authenticated: false },
            { headers: { "Set-Cookie": sessionCookie("", 0) } },
          );
        }

        if (body.action !== "login") return jsonError("Unsupported action.", 400);

        const password = configuredPassword();
        if (!password) return jsonError("Application password is not configured.", 500);
        if (typeof body.password !== "string" || body.password !== password) {
          return jsonError("Incorrect password.", 401);
        }

        const token = await digest(password);
        return Response.json(
          { ok: true, authenticated: true },
          { headers: { "Set-Cookie": sessionCookie(token, SESSION_SECONDS) } },
        );
      },
    },
  },
});
