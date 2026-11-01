/**
 * SIAKAD Pesantren - Middleware Autentikasi & RBAC (Role-Based Access Control)
 * Kompatibel dengan Cloudflare Workers (Web Crypto V8) dan Node.js 18+
 */
import { Context } from 'hono';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema.ts';

// Helper Web Crypto: Buffer ke Hex String
export function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

// Helper Web Crypto: Hex String ke Uint8Array
export function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Hash password menggunakan PBKDF2 HMAC-SHA256 (100.000 iterasi)
 */
export async function hashPassword(password: string, existingSalt?: string): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  const salt = existingSalt ? hexToBuffer(existingSalt) : crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    true,
    ['sign']
  );

  const exported = await crypto.subtle.exportKey('raw', derivedKey);
  const hashHex = bufferToHex(exported);
  const saltHex = existingSalt || bufferToHex(salt.buffer as ArrayBuffer);

  return { hash: hashHex, salt: saltHex };
}

/**
 * Verifikasi password dengan constant-time comparison
 */
export async function verifyPassword(password: string, storedHash: string, storedSalt: string): Promise<boolean> {
  const { hash } = await hashPassword(password, storedSalt);
  if (hash.length !== storedHash.length) return false;
  let result = 0;
  for (let i = 0; i < hash.length; i++) {
    result |= hash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Buat random 32-byte session token
 */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes.buffer as ArrayBuffer);
}

/**
 * Baca cookie dari header HTTP
 */
export function getCookie(header: string | undefined | null, name: string): string | null {
  if (!header) return null;
  const match = header.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Tipe data Pengguna Terotentikasi & Cakupan RBAC
 */
export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: 'superadmin' | 'admin_lembaga' | 'pengurus_asrama' | 'viewer';
  assignedLembagaIds: string[];
  assignedAsramaIds: string[];
  phone?: string | null;
  avatarUrl?: string | null;
  mustChangePassword?: boolean;
}

/**
 * Ekstrak sesi pengguna aktif dari cookie siakad_session
 */
export async function getAuthUser(c: Context): Promise<AuthUser | null> {
  const cookieHeader = c.req.header('Cookie');
  const token = getCookie(cookieHeader, 'siakad_session');
  if (!token) return null;

  const db = drizzle(c.env.DB, { schema });
  const session = await db
    .select({
      sessionId: schema.sessions.id,
      expiresAt: schema.sessions.expiresAt,
      userId: schema.users.id,
      username: schema.users.username,
      fullName: schema.users.fullName,
      role: schema.users.role,
      assignedLembagaIds: schema.users.assignedLembagaIds,
      assignedAsramaIds: schema.users.assignedAsramaIds,
      phone: schema.users.phone,
      avatarUrl: schema.users.avatarUrl,
      isActive: schema.users.isActive,
      mustChangePassword: schema.users.mustChangePassword,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(eq(schema.sessions.token, token))
    .get();

  if (!session || new Date(session.expiresAt) < new Date() || !session.isActive) {
    return null;
  }

  let lembagaIds: string[] = [];
  let asramaIds: string[] = [];

  try {
    if (session.assignedLembagaIds) lembagaIds = JSON.parse(session.assignedLembagaIds);
  } catch (e) {}

  try {
    if (session.assignedAsramaIds) asramaIds = JSON.parse(session.assignedAsramaIds);
  } catch (e) {}

  return {
    id: session.userId,
    username: session.username,
    fullName: session.fullName,
    role: session.role as 'superadmin' | 'admin_lembaga' | 'pengurus_asrama' | 'viewer',
    assignedLembagaIds: lembagaIds,
    assignedAsramaIds: asramaIds,
    phone: session.phone,
    avatarUrl: session.avatarUrl,
    mustChangePassword: session.mustChangePassword === 1,
  };
}

/**
 * Middleware: Cek izin tulis (Super Admin, Admin Lembaga, Pengurus Asrama)
 */
export function requireWritePermission(user: AuthUser | null) {
  if (!user) {
    return { error: 'Silakan login terlebih dahulu untuk melakukan aksi ini', status: 401 };
  }
  if (user.role === 'viewer') {
    return { error: 'Akses ditolak: Akun Viewer hanya memiliki izin baca (Read-Only)', status: 403 };
  }
  return null;
}
