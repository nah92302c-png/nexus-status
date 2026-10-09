import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Minimal in-memory Supabase client for repository unit tests.
 *
 * It reproduces the query chains the repository actually uses
 * (insert/update/delete + select + eq + single/maybeSingle, awaited writes)
 * and emulates the unique-slug constraint. RLS itself is covered separately by
 * the real-Postgres tests in tests/database.test.ts.
 *
 * Behaviour notes:
 * - PostgREST resolves with `{ data, error }`; it never rejects. Errors are
 *   surfaced via the `error` field so the repository can map Postgres codes
 *   (e.g. 23505 -> conflict).
 * - Writes followed by `.select().single()` return the single written row,
 *   mirroring the real client.
 * - Returned rows are copies, never references to the in-memory table. This
 *   mimics PostgREST serializing/deserializing JSON so mutations of a row the
 *   repository already read (e.g. `existing` in updateService) do not alias the
 *   table row.
 */

export interface FakeState {
  services: Array<Record<string, unknown>>;
  audit_log: Array<Record<string, unknown>>;
}

export function createFakeState(): FakeState {
  return { services: [], audit_log: [] };
}

type Row = Record<string, unknown>;

function copyRow(row: Row): Row {
  return { ...row };
}

/**
 * JSON serialization drops `undefined` values, so supabase-js never sends them
 * and the database column defaults apply instead.
 */
function stripUndefined(row: Row): Row {
  return Object.fromEntries(
    Object.entries(row).filter(([, value]) => value !== undefined),
  );
}

/** Mirror the column defaults declared in migrations/0001_init.sql. */
const TABLE_DEFAULTS: Record<string, Row> = {
  services: {
    status: "unknown",
    status_mode: "manual",
    status_source: "manual",
    sort_order: 0,
    is_visible: true,
  },
};

class QueryBuilder {
  private op: "select" | "insert" | "update" | "delete" = "select";
  private filters: Array<{ col: string; value: unknown }> = [];
  private countMode: boolean = false;
  private singleMode: boolean = false;
  private maybeSingleMode: boolean = false;

  constructor(
    private api: FakeApi,
    private table: keyof FakeState,
  ) {}

  select(_columns?: string, opts?: { count?: "exact" | "planned" | "estimated" }) {
    // Preserve write ops: `insert().select().single()` must still execute the
    // insert. `op` already defaults to "select", so there is nothing to do here.
    this.countMode = Boolean(opts?.count);
    return this;
  }

  insert(payload: Row | Row[]) {
    this.op = "insert";
    this.api._pending = (Array.isArray(payload) ? payload : [payload]).map(
      (row) => ({ ...TABLE_DEFAULTS[this.table], ...stripUndefined(row) }),
    );
    return this;
  }

  update(payload: Row) {
    this.op = "update";
    this.api._pending = [stripUndefined(payload)];
    return this;
  }

  delete() {
    this.op = "delete";
    return this;
  }

  eq(col: string, value: unknown) {
    this.filters.push({ col, value });
    return this;
  }

  order(_col: string, _opts?: { ascending?: boolean }) {
    return this;
  }

  limit(_n: number) {
    return this;
  }

  range(_from: number, _to: number) {
    return this;
  }

  single() {
    this.singleMode = true;
    return this;
  }

  maybeSingle() {
    this.maybeSingleMode = true;
    return this;
  }

  private matches(row: Row): boolean {
    return this.filters.every(({ col, value }) => row[col] === value);
  }

  private now(): string {
    return new Date().toISOString();
  }

  private execute(): { data: Row[] | Row | null; error: Error | null; count?: number } {
    const table = this.api.state[this.table];

    if (this.op === "select") {
      const rows = table.filter((row) => this.matches(row)).map(copyRow);
      const count = rows.length;
      if (this.singleMode || this.maybeSingleMode) {
        const row = rows.shift() ?? null;
        return { data: row, error: null, count };
      }
      return { data: rows, error: null, count };
    }

    if (this.op === "insert") {
      const payloads = (this.api._pending as Row[]) ?? [];
      const inserted: Row[] = [];
      for (const payload of payloads) {
        const slug = payload.slug as string | undefined;
        if (
          slug &&
          table.some(
            (row) => row.slug === slug && row.id !== payload.id,
          )
        ) {
          const error = Object.assign(new Error("duplicate key"), {
            code: "23505",
            details: `Key (slug)=(${slug}) already exists.`,
          });
          return { data: null, error };
        }
        const row: Row = {
          id: payload.id ?? crypto.randomUUID(),
          created_at: payload.created_at ?? this.now(),
          updated_at: payload.updated_at ?? this.now(),
          ...payload,
        };
        table.push(row);
        inserted.push(copyRow(row));
      }
      this.api._pending = [];
      if (this.singleMode || this.maybeSingleMode) {
        return { data: inserted[0] ?? null, error: null };
      }
      return { data: inserted, error: null };
    }

    if (this.op === "update") {
      const payload = (this.api._pending as Row[])[0] ?? {};
      const updated: Row[] = [];
      for (const row of table) {
        if (this.matches(row)) {
          const next = { ...row, ...payload, updated_at: this.now() };
          Object.assign(row, next);
          updated.push(copyRow(row));
        }
      }
      this.api._pending = [];
      if (this.singleMode || this.maybeSingleMode) {
        const row = updated.shift() ?? null;
        return { data: row, error: null };
      }
      return { data: updated, error: null };
    }

    if (this.op === "delete") {
      const deleted: Row[] = [];
      const remaining: Row[] = [];
      for (const row of table) {
        if (this.matches(row)) deleted.push(copyRow(row));
        else remaining.push(row);
      }
      // swap in the filtered array
      (this.api.state[this.table] as Row[]) = remaining;
      return { data: deleted, error: null };
    }

    return { data: null, error: null };
  }

  then(
    onFulfilled?: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) {
    // PostgREST always resolves; database errors come back in the `error`
    // field so the repository can map them. Do not reject here.
    const result = this.execute();
    return Promise.resolve(result).then(onFulfilled, onRejected);
  }
}

class FakeApi {
  _pending: Row[] = [];

  constructor(readonly state: FakeState) {}

  from(table: string) {
    if (table !== "services" && table !== "audit_log") {
      throw new Error(`Unexpected table in fake: ${table}`);
    }
    return new QueryBuilder(this, table);
  }
}

export function createFakeClient(state: FakeState) {
  return new FakeApi(state) as unknown as SupabaseClient;
}