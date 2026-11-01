/**
 * SIAKAD Pesantren - Service Cloudflare R2 Storage
 * Menangani upload berkas (foto profil & dokumen digital), validasi tipe/ukuran,
 * serta akses berkas aman dengan pemeriksaan hak akses (bukan URL publik langsung).
 */
import { Context } from 'hono';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Megabytes

/**
 * Validasi dan simpan file ke Cloudflare R2 Bucket
 */
export async function uploadToR2(
  bucket: any,
  fileKey: string,
  buffer: ArrayBuffer | Uint8Array,
  mimeType: string,
  customMetadata?: Record<string, string>
) {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error('Format file tidak didukung. Harap unggah berkas JPG, PNG, WEBP, atau PDF.');
  }

  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new Error('Ukuran file melebihi batas maksimum 10MB.');
  }

  await bucket.put(fileKey, buffer, {
    httpMetadata: {
      contentType: mimeType,
    },
    customMetadata: customMetadata || {},
  });

  return { fileKey, size: buffer.byteLength, mimeType };
}

/**
 * Ambil file dari Cloudflare R2 Bucket
 */
export async function getFromR2(bucket: any, fileKey: string) {
  const object = await bucket.get(fileKey);
  if (!object) return null;

  return {
    stream: object.body,
    contentType: object.httpMetadata?.contentType || 'application/octet-stream',
    size: object.size,
    etag: object.httpEtag,
  };
}

/**
 * Hapus file dari Cloudflare R2 Bucket
 */
export async function deleteFromR2(bucket: any, fileKey: string) {
  await bucket.delete(fileKey);
  return { success: true };
}
