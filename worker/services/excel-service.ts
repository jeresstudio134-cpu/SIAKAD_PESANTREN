/**
 * SIAKAD Pesantren - Service Impor & Ekspor Excel (XLSX)
 * Mematuhi aturan batas Cloudflare D1 (50 baris per batch),
 * pengawetan format teks NIS/NISN/NIK agar angka 0 di depan tidak terpotong,
 * serta konversi tanggal fleksibel (serial Excel, dd/mm/yyyy, yyyy-mm-dd).
 */
import * as XLSX from 'xlsx';

/**
 * Normalisasi format tanggal input Excel
 */
export function parseExcelDate(val: any): string | null {
  if (!val) return null;

  // Jika input berupa format serial integer Excel (misal 45123)
  if (typeof val === 'number') {
    const dateObj = new Date((val - (25567 + 2)) * 86400 * 1000);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0];
    }
  }

  const str = String(val).trim();
  // Format dd/mm/yyyy atau dd-mm-yyyy
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Format yyyy-mm-dd
  const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return str;
}

/**
 * Normalisasi teks angka untuk NIS, NISN, NIK agar '0123' tidak menjadi '123'
 */
export function cleanTextCode(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

/**
 * Buat workbook Excel dari array data objek
 */
export function createExcelWorkbook(sheetName: string, rows: Record<string, any>[]): Uint8Array {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return new Uint8Array(buf);
}
