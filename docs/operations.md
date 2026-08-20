# Operations

Use separate local, preview, and production Cloudflare environments. Keep `.dev.vars`, `.env`, API tokens, dashboard secrets, and credentials out of source control.

## Local validation

```bash
npm install
npm run check
```

## Local services

```bash
npm run dev:api
npm run dev:gateway
```

Deploy the demo API before the gateway. D1 and Durable Object resource creation and migrations will be added with their implementation phases.
