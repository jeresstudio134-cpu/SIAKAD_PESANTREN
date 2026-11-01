/**
 * Cloudflare Workers Entry Point for SIAKAD Pesantren
 * Runs on Cloudflare's edge network with D1 (DB) and R2 (BUCKET) bindings
 */
import { app } from './server/app.ts';

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // If it's an API route or storage route, handle via Hono
    if (url.pathname.startsWith('/api')) {
      return app.fetch(request, env, ctx);
    }

    // For non-API routes when using Cloudflare Workers Static Assets binding (c.env.ASSETS)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return app.fetch(request, env, ctx);
  },
};
