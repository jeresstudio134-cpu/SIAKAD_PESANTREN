/**
 * Cloudflare D1 Database Emulator for Local Development using better-sqlite3
 * Faithfully implements the D1Database and D1PreparedStatement interfaces
 */
import type Database from 'better-sqlite3';

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta: {
    duration?: number;
    changes?: number;
    last_row_id?: number | bigint;
    served_by?: string;
  };
  error?: string;
}

export class D1PreparedStatementEmulator {
  constructor(
    private db: Database.Database,
    private sql: string,
    private params: any[] = []
  ) {}

  bind(...values: any[]) {
    return new D1PreparedStatementEmulator(this.db, this.sql, values);
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    try {
      const stmt = this.db.prepare(this.sql);
      const row = stmt.get(...this.params) as any;
      if (!row) return null;
      if (colName) return row[colName] ?? null;
      return row as T;
    } catch (err: any) {
      console.error('D1 first error:', err, 'SQL:', this.sql);
      throw err;
    }
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    try {
      const stmt = this.db.prepare(this.sql);
      const rows = stmt.all(...this.params) as T[];
      return {
        results: rows,
        success: true,
        meta: {
          duration: 0.1,
          changes: 0,
        },
      };
    } catch (err: any) {
      console.error('D1 all error:', err, 'SQL:', this.sql);
      return {
        results: [],
        success: false,
        error: err.message,
        meta: {},
      };
    }
  }

  async run<T = unknown>(): Promise<D1Result<T>> {
    try {
      const stmt = this.db.prepare(this.sql);
      const info = stmt.run(...this.params);
      return {
        success: true,
        meta: {
          changes: info.changes,
          last_row_id: info.lastInsertRowid,
          duration: 0.1,
        },
      };
    } catch (err: any) {
      console.error('D1 run error:', err, 'SQL:', this.sql);
      return {
        success: false,
        error: err.message,
        meta: { changes: 0 },
      };
    }
  }

  async raw<T = unknown>(): Promise<T[]> {
    const stmt = this.db.prepare(this.sql);
    return stmt.raw(true).all(...this.params) as T[];
  }
}

export function createD1Emulator(sqliteDb: Database.Database) {
  return {
    prepare(sql: string) {
      return new D1PreparedStatementEmulator(sqliteDb, sql);
    },
    async batch<T = unknown>(statements: D1PreparedStatementEmulator[]): Promise<D1Result<T>[]> {
      const results: D1Result<T>[] = [];
      const tx = sqliteDb.transaction(() => {
        for (const s of statements) {
          // Check if statement is SELECT or mutation
          const isSelect = /^\s*(SELECT|PRAGMA)/i.test((s as any).sql);
          if (isSelect) {
            const stmt = sqliteDb.prepare((s as any).sql);
            const rows = stmt.all(...(s as any).params) as T[];
            results.push({
              results: rows,
              success: true,
              meta: { changes: 0 },
            });
          } else {
            const stmt = sqliteDb.prepare((s as any).sql);
            const info = stmt.run(...(s as any).params);
            results.push({
              success: true,
              meta: { changes: info.changes, last_row_id: info.lastInsertRowid },
            });
          }
        }
      });
      tx();
      return results;
    },
    async exec(sql: string) {
      sqliteDb.exec(sql);
      return { count: 1, duration: 0.1 };
    },
    // Expose raw sqlite for seeding
    _rawDb: sqliteDb,
  };
}
