import { loadConfig, type RawConfig } from "../../../packages/contracts/src/config";
import type { RequestContext } from "../../../packages/contracts/src/index";
import { extractRequestContext } from "./request-context";

export interface Env extends RawConfig {
  DASHBOARD_SECRET?: string;
}

export type UpstreamFetch = (request: Request) => Promise<Response>;

const REMOVED_FORWARD_HEADERS = [
  "cf-connecting-ip",
  "cf-ipcountry",
  "cf-ray",
  "content-length",
  "host",
  "x-forwarded-for"
];

function jsonResponse(body: unknown, status: number, id: string): Response {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store", "x-request-id": id }
  });
}

async function createUpstreamRequest(
  request: Request,
  baseUrl: URL,
  context: RequestContext
): Promise<Request> {
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(incomingUrl.pathname + incomingUrl.search, baseUrl);
  const headers = new Headers(request.headers);
  for (const header of REMOVED_FORWARD_HEADERS) headers.delete(header);
  headers.set("x-request-id", context.requestId);
  headers.set("x-edge-gateway", "edge-threat-detection");
  const body =
    request.method === "GET" || request.method === "HEAD" ? null : await request.arrayBuffer();
  return new Request(targetUrl, {
    method: request.method,
    headers,
    body,
    redirect: "manual"
  });
}

function createGatewayResponse(upstream: Response, id: string, elapsedMs: number): Response {
  const headers = new Headers(upstream.headers);
  headers.set("x-request-id", id);
  headers.set("server-timing", `edge;dur=${elapsedMs.toFixed(2)}`);
  headers.delete("content-length");
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers
  });
}

export async function handleGatewayRequest(
  request: Request,
  env: Env,
  fetchUpstream: UpstreamFetch = fetch
): Promise<Response> {
  const startedAt = performance.now();
  const config = loadConfig(env);
  const context = await extractRequestContext(
    request,
    request.headers.get("x-request-id") ?? undefined
  );
  const url = new URL(request.url);
  if (url.pathname === "/health") {
    return jsonResponse(
      { status: "ok", service: "gateway", environment: config.environment },
      200,
      context.requestId
    );
  }
  try {
    const upstreamRequest = await createUpstreamRequest(request, config.upstreamApiUrl, context);
    const upstream = await fetchUpstream(upstreamRequest);
    return createGatewayResponse(upstream, context.requestId, performance.now() - startedAt);
  } catch {
    return jsonResponse(
      { error: "upstream unavailable", requestId: context.requestId },
      502,
      context.requestId
    );
  }
}

export default {
  fetch: handleGatewayRequest
};
