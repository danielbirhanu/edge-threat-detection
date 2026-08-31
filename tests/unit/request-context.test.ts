import { describe, expect, it } from "vitest";
import { extractRequestContext } from "../../workers/gateway/src/request-context";

describe("extractRequestContext", () => {
  it("normalizes metadata without exposing authorization values", async () => {
    const request = new Request("https://gateway.test/api/products?page=1&page=2&sort=name", {
      headers: {
        authorization: "Bearer secret-session",
        "cf-connecting-ip": "203.0.113.10",
        "cf-ipcountry": "ET",
        "user-agent": "gateway-test"
      }
    });
    const context = await extractRequestContext(request, "req-context");
    expect(context).toMatchObject({
      requestId: "req-context",
      method: "GET",
      path: "/api/products",
      queryKeys: ["page", "sort"],
      identity: { kind: "session" },
      ip: "203.0.113.10",
      country: "ET",
      authenticated: true
    });
    expect(context).not.toHaveProperty("authorization");
    expect(context.identity.value).not.toBe("secret-session");
  });

  it("prefers hashed API keys and otherwise uses the Cloudflare IP", async () => {
    const apiKey = await extractRequestContext(
      new Request("https://gateway.test/api/products", { headers: { "x-api-key": "client-key" } })
    );
    expect(apiKey.identity.kind).toBe("api_key");
    expect(apiKey.identity.value).not.toBe("client-key");
    const anonymous = await extractRequestContext(
      new Request("https://gateway.test/api/products", {
        headers: { "cf-connecting-ip": "198.51.100.4" }
      })
    );
    expect(anonymous.identity).toEqual({ kind: "ip", value: "198.51.100.4" });
  });
});
