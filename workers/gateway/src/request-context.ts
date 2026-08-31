import type { Identity, RequestContext } from "../../../packages/contracts/src/index";

async function hashIdentity(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function resolveIdentity(request: Request): Promise<Identity> {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey) return { kind: "api_key", value: await hashIdentity(apiKey) };
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer "))
    return { kind: "session", value: await hashIdentity(authorization.slice(7)) };
  return { kind: "ip", value: request.headers.get("cf-connecting-ip") ?? "unknown" };
}

function optionalHeader(request: Request, name: string): string | undefined {
  return request.headers.get(name) ?? undefined;
}

export async function extractRequestContext(
  request: Request,
  id: string = crypto.randomUUID()
): Promise<RequestContext> {
  const url = new URL(request.url);
  const rawSize = request.headers.get("content-length");
  const requestSize = rawSize === null ? undefined : Number(rawSize);
  const ip = optionalHeader(request, "cf-connecting-ip");
  const country = optionalHeader(request, "cf-ipcountry");
  const userAgent = optionalHeader(request, "user-agent");
  const contentType = optionalHeader(request, "content-type");
  return {
    requestId: id,
    timestamp: new Date().toISOString(),
    method: request.method,
    path: url.pathname,
    queryKeys: [...new Set(url.searchParams.keys())],
    identity: await resolveIdentity(request),
    ...(ip === undefined ? {} : { ip }),
    ...(country === undefined ? {} : { country }),
    ...(userAgent === undefined ? {} : { userAgent }),
    ...(contentType === undefined ? {} : { contentType }),
    ...(requestSize !== undefined && Number.isFinite(requestSize) ? { requestSize } : {}),
    authenticated: request.headers.has("authorization") || request.headers.has("x-api-key")
  };
}
