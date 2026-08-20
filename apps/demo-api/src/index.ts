export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") return Response.json({ status: "ok", service: "demo-api" });
    return Response.json({ error: "Not found" }, { status: 404 });
  }
};
