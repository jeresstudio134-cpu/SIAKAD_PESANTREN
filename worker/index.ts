/**
 * Cloudflare Workers Entry Point - SIAKAD Pesantren
 * Dijalankan di Cloudflare Edge Network dengan binding D1 (DB), R2 (BUCKET), dan Static Assets (ASSETS)
 */
import { app } from './app.ts';

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Endpoint API dan Storage ditangani oleh Hono router
    if (url.pathname.startsWith('/api')) {
      return app.fetch(request, env, ctx);
    }

    // Untuk rute frontend SPA pada deployment Cloudflare Workers Static Assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return app.fetch(request, env, ctx);
  },
};
