import { loadConfig, type RawConfig } from "../../../packages/contracts/src/config";

export interface Env extends RawConfig {
  DASHBOARD_SECRET?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const config = loadConfig(env);
    const url = new URL(request.url);
    if (url.pathname === "/health")
      return Response.json({ status: "ok", service: "gateway", environment: config.environment });
    return Response.json(
      { status: "foundation-ready", message: "Gateway proxying is implemented in Phase 1." },
      { status: 501 }
    );
  }
};
