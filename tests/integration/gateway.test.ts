import { describe, expect, it, vi } from "vitest";
import demoApi from "../../apps/demo-api/src/index";
import { handleGatewayRequest, type Env } from "../../workers/gateway/src/index";

const env: Env = {
  ENVIRONMENT: "development",
  UPSTREAM_API_URL: "https://demo.test",
  RISK_RATE_LIMIT_THRESHOLD: "60",
  RISK_BLOCK_THRESHOLD: "80",
  EVENT_RETENTION_DAYS: "30"
};
const throughGateway = (path: string, init?: RequestInit) =>
  handleGatewayRequest(new Request(`https://gateway.test${path}`, init), env, (request) =>
    demoApi.fetch(request)
  );

describe("gateway proxy", () => {
  it("serves its own health endpoint", async () => {
    const response = await throughGateway("/health", {
      headers: { "x-request-id": "req-health" }
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("req-health");
    await expect(response.json()).resolves.toMatchObject({ service: "gateway" });
  });

  it("proxies requests and preserves query strings", async () => {
    let receivedUrl = "";
    const response = await handleGatewayRequest(
      new Request("https://gateway.test/api/products?category=security"),
      env,
      async (request) => {
        receivedUrl = request.url;
        return demoApi.fetch(request);
      }
    );
    expect(receivedUrl).toBe("https://demo.test/api/products?category=security");
    expect(response.status).toBe(200);
    expect(response.headers.get("server-timing")).toContain("edge;dur=");
  });

  it("forwards POST bodies and authentication", async () => {
    const login = await throughGateway("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "demo", password: "demo-password" })
    });
    expect(login.status).toBe(200);
    const profile = await throughGateway("/api/profile", {
      headers: { authorization: "Bearer demo-session-demo" }
    });
    expect(profile.status).toBe(200);
  });

  it("removes spoofable edge headers before proxying", async () => {
    let forwarded: Headers | undefined;
    await handleGatewayRequest(
      new Request("https://gateway.test/api/products", {
        headers: { "cf-connecting-ip": "203.0.113.1", "x-forwarded-for": "spoofed" }
      }),
      env,
      async (request) => {
        forwarded = request.headers;
        return demoApi.fetch(request);
      }
    );
    expect(forwarded?.get("cf-connecting-ip")).toBeNull();
    expect(forwarded?.get("x-forwarded-for")).toBeNull();
    expect(forwarded?.get("x-edge-gateway")).toBe("edge-threat-detection");
  });

  it("returns a controlled 502 when upstream is unavailable", async () => {
    const unavailable = vi.fn(async () => {
      throw new Error("connection refused");
    });
    const response = await handleGatewayRequest(
      new Request("https://gateway.test/api/health", {
        headers: { "x-request-id": "req-fail" }
      }),
      env,
      unavailable
    );
    expect(response.status).toBe(502);
    expect(response.headers.get("x-request-id")).toBe("req-fail");
    await expect(response.json()).resolves.toEqual({
      error: "upstream unavailable",
      requestId: "req-fail"
    });
  });
});
