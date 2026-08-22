type DemoUser = { username: string; password: string; displayName: string; role: "user" | "admin" };
type LoginBody = { username?: unknown; password?: unknown };
const USERS: readonly DemoUser[] = [
  { username: "demo", password: "demo-password", displayName: "Demo User", role: "user" },
  { username: "admin", password: "admin-password", displayName: "Demo Admin", role: "admin" }
];
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};
function requestId(request: Request): string {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}
function responseBody(request: Request, body: unknown, status = 200): Response {
  const headers = new Headers(JSON_HEADERS);
  headers.set("x-request-id", requestId(request));
  return new Response(JSON.stringify(body), { status, headers });
}
function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-headers", "content-type, authorization, x-request-id");
  headers.set("access-control-allow-methods", "GET, POST, OPTIONS");
  return new Response(response.body, { status: response.status, headers });
}
function tokenFor(username: string): string {
  return `demo-session-${username}`;
}
function userFromToken(request: Request): DemoUser | undefined {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return undefined;
  return USERS.find((user) => tokenFor(user.username) === authorization.slice("Bearer ".length));
}
async function parseLoginBody(request: Request): Promise<LoginBody | undefined> {
  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null ? (body as LoginBody) : undefined;
  } catch {
    return undefined;
  }
}
export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return responseBody(request, null, 204);
  if (url.pathname === "/api/health" && request.method === "GET")
    return responseBody(request, { status: "ok", service: "demo-api" });
  if (url.pathname === "/api/login" && request.method === "POST") {
    const body = await parseLoginBody(request);
    if (typeof body?.username !== "string" || typeof body.password !== "string")
      return responseBody(request, { error: "username and password are required" }, 400);
    const user = USERS.find((candidate) => candidate.username === body.username);
    if (!user || user.password !== body.password)
      return responseBody(request, { error: "invalid credentials" }, 401);
    return responseBody(request, {
      accessToken: tokenFor(user.username),
      tokenType: "Bearer",
      expiresIn: 3600,
      user: { username: user.username, displayName: user.displayName, role: user.role }
    });
  }
  if (url.pathname === "/api/profile" && request.method === "GET") {
    const user = userFromToken(request);
    if (!user) return responseBody(request, { error: "authentication required" }, 401);
    return responseBody(request, {
      user: { username: user.username, displayName: user.displayName, role: user.role }
    });
  }
  if (url.pathname === "/api/products" && request.method === "GET")
    return responseBody(request, {
      products: [
        { id: "edge-001", name: "Edge Gateway", category: "security", available: true },
        { id: "edge-002", name: "Threat Analytics", category: "security", available: true },
        { id: "edge-003", name: "Audit Export", category: "reports", available: false }
      ]
    });
  return responseBody(request, { error: "not found" }, 404);
}
export default {
  async fetch(request: Request): Promise<Response> {
    return withCors(await handleRequest(request));
  }
};
