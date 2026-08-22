import { describe, expect, it } from "vitest";
import demoApi from "../../apps/demo-api/src/index";
const fetchApi = (path: string, init?: RequestInit) =>
  demoApi.fetch(new Request(`https://demo.test${path}`, init));
describe("demo API", () => {
  it("returns health and request metadata", async () => {
    const response = await fetchApi("/api/health", { headers: { "x-request-id": "req-health" } });
    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("req-health");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    await expect(response.json()).resolves.toEqual({ status: "ok", service: "demo-api" });
  });
  it("logs in with the deterministic demo account", async () => {
    const response = await fetchApi("/api/login", {
      method: "POST",
      body: JSON.stringify({ username: "demo", password: "demo-password" }),
      headers: { "content-type": "application/json" }
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      accessToken: "demo-session-demo",
      tokenType: "Bearer"
    });
  });
  it("returns a predictable failure for invalid login attempts", async () => {
    const response = await fetchApi("/api/login", {
      method: "POST",
      body: JSON.stringify({ username: "demo", password: "wrong-password" }),
      headers: { "content-type": "application/json" }
    });
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "invalid credentials" });
  });
  it("protects profile and accepts the demo token", async () => {
    expect((await fetchApi("/api/profile")).status).toBe(401);
    const response = await fetchApi("/api/profile", {
      headers: { authorization: "Bearer demo-session-demo" }
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      user: { username: "demo", role: "user" }
    });
  });
  it("serves products and returns JSON 404s", async () => {
    expect((await fetchApi("/api/products")).status).toBe(200);
    const missing = await fetchApi("/api/does-not-exist");
    expect(missing.status).toBe(404);
    await expect(missing.json()).resolves.toEqual({ error: "not found" });
  });
});
