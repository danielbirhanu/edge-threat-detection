# Edge Threat Detection

A Cloudflare-native security gateway for web and API traffic. The v1 system will combine deterministic rules, per-identity behavior stored in Durable Objects, configurable risk scoring, and independent policy enforcement.

## Current status

The project foundation is configured: npm workspaces, strict TypeScript, Wrangler entry points, shared contracts, validated environment configuration, Vitest, formatting, and CI. Detection and proxy behavior are the next implementation phase.

## Workspace

- `workers/gateway`: edge gateway Worker.
- `apps/demo-api`: protected demonstration API.
- `apps/dashboard`: security dashboard placeholder.
- `apps/attack-lab`: traffic simulator placeholder.
- `packages/contracts`: shared types and configuration validation.
- `packages/detection`, `risk-engine`, `policy-engine`: security engine boundaries.

## Local setup

```bash
npm install
npm run check
```

Copy the documented values from `.env.example` into `.dev.vars` when local secrets are needed. Never commit `.dev.vars`.

Run the two current Worker services in separate terminals:

```bash
npm run dev:api
npm run dev:gateway
```

The demo API uses port `8788` and the gateway uses `8787`.

## Scope boundary

Workers AI is not part of the v1 request path. It is reserved for selective analysis of ambiguous events in v2 and will never independently authorize blocking.

See `docs/threat-model.md` for initial security assumptions.
