import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createD1Emulator } from './src/server/d1-adapter.ts';
import { createR2Emulator } from './src/server/r2-adapter.ts';
import { seedDatabase } from './src/server/seed.ts';
import { app as honoApp } from './src/server/app.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const server = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  console.log('🚀 Menginisialisasi SIAKAD Pesantren Engine...');

  // 1. Inisialisasi Database SQLite Lokal (Simulasi Cloudflare D1)
  const dbPath = path.join(__dirname, '.d1_local.sqlite');
  const sqliteDb = new Database(dbPath);

  // Jalankan Migrasi D1 Init SQL
  const migrationPath = path.join(__dirname, 'migrations', '0000_init.sql');
  if (fs.existsSync(migrationPath)) {
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    sqliteDb.exec(migrationSql);
  }

  // Seed Data: 2.000 Santri, Staf, & Akun Awal
  await seedDatabase(sqliteDb);

  // Buat Binding D1 dan R2 Emulator
  const d1Binding = createD1Emulator(sqliteDb);
  const r2Binding = createR2Emulator();

  const workerEnv = {
    DB: d1Binding,
    BUCKET: r2Binding,
    JWT_SECRET: process.env.JWT_SECRET || 'siakad-pesantren-dev-secret-key-2026',
  };

  // 2. Hubungkan Route /api/* ke Hono Backend
  server.all('/api/*', async (req, res) => {
    try {
      const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach((v) => headers.append(key, v));
          } else {
            headers.set(key, value);
          }
        }
      }

      // Convert Express request stream / buffer to Web Request Body
      let body: any = null;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        body = Buffer.concat(chunks);
      }

      const webRequest = new Request(fullUrl, {
        method: req.method,
        headers,
        body,
        duplex: 'half',
      } as any);

      const response = await honoApp.fetch(webRequest, workerEnv);

      // Copy response status and headers back to Express response
      res.status(response.status);
      response.headers.forEach((val, key) => {
        // Express res.setHeader handles headers
        res.setHeader(key, val);
      });

      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      console.error('API Error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Mount Vite Dev Middlewares (Dev Mode)
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    server.use(vite.middlewares);
  } else {
    // Serve static files in production if dist exists
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      server.use(express.static(distPath));
      server.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ SIAKAD Pesantren aktif di http://localhost:${PORT}`);
    console.log(`📡 Cloudflare D1 & R2 local bindings siap melayani 2.000+ data santri`);
  });
}

startServer().catch((err) => {
  console.error('Gagal menjalankan server:', err);
  process.exit(1);
});
