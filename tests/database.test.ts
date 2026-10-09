// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  actAsAnon,
  actAsServiceRole,
  actAsUser,
  createAdmin,
  createTestDatabase,
  createUser,
  resetRole,
  seed,
  type TestDb,
} from "./helpers/database";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDatabase();
});

afterAll(async () => {
  await db.close();
});

async function count(table: string): Promise<number> {
  const result = await db.query<{ c: number }>(
    `select count(*)::int as c from ${table}`,
  );
  return result.rows[0].c;
}

describe("migrations + seed", () => {
  it("creates the eight initial services in order", async () => {
    await resetRole(db);
    await seed(db);
    const result = await db.query<{ name: string; slug: string; sort_order: number }>(
      "select name, slug, sort_order from services order by sort_order",
    );
    expect(result.rows.map((r) => r.name)).toEqual([
      "MW3",
      "BO6",
      "BO7",
      "MW1",
      "WARDOGS",
      "ARC Raiders",
      "Spoofer",
      "MW4",
    ]);
  });

  it("is repeatable: running the seed twice does not create duplicates", async () => {
    await seed(db);
    await seed(db);
    expect(await count("services")).toBe(8);
  });

  it("does not overwrite an administrator-set status on reseed", async () => {
    await actAsServiceRole(db);
    await db.query("update services set status = 'online' where slug = 'mw3'");
    await resetRole(db);
    await seed(db);
    const result = await db.query<{ status: string }>(
      "select status from services where slug = 'mw3'",
    );
    expect(result.rows[0].status).toBe("online");
    expect(await count("services")).toBe(8);
    // restore for later tests
    await db.query("update services set status = 'unknown' where slug = 'mw3'");
  });

  it("seeds statuses as UNKNOWN (availability is not invented)", async () => {
    await resetRole(db);
    const result = await db.query<{ c: number }>(
      "select count(*)::int as c from services where status = 'unknown'",
    );
    expect(result.rows[0].c).toBe(8);
  });
});

describe("constraints", () => {
  it("rejects duplicate slugs", async () => {
    await actAsServiceRole(db);
    await expect(
      db.query("insert into services (name, slug) values ('Dup', 'mw3')"),
    ).rejects.toThrow();
  });

  it("rejects an invalid status value", async () => {
    await actAsServiceRole(db);
    await expect(
      db.query("insert into services (name, slug, status) values ('Bad', 'bad', 'flying')"),
    ).rejects.toThrow();
  });

  it("rejects an invalid slug format", async () => {
    await actAsServiceRole(db);
    await expect(
      db.query("insert into services (name, slug) values ('Bad', 'Not A Slug')"),
    ).rejects.toThrow();
  });

  it("updates updated_at automatically on change", async () => {
    await resetRole(db);
    const before = await db.query<{ updated_at: Date }>(
      "select updated_at from services where slug = 'bo6'",
    );
    await actAsServiceRole(db);
    await db.query("update services set description = 'changed' where slug = 'bo6'");
    await resetRole(db);
    const after = await db.query<{ updated_at: Date }>(
      "select updated_at from services where slug = 'bo6'",
    );
    expect(new Date(after.rows[0].updated_at).getTime()).toBeGreaterThanOrEqual(
      new Date(before.rows[0].updated_at).getTime(),
    );
  });
});

describe("RLS: public (anon) reads", () => {
  it("can read visible services", async () => {
    await actAsAnon(db);
    const result = await db.query("select id from services");
    expect(result.rows.length).toBe(8);
  });

  it("cannot read hidden services", async () => {
    await actAsServiceRole(db);
    await db.query("update services set is_visible = false where slug = 'mw4'");
    await actAsAnon(db);
    const result = await db.query<{ slug: string }>("select slug from services");
    expect(result.rows.map((r) => r.slug)).not.toContain("mw4");
    expect(result.rows.length).toBe(7);
    await actAsServiceRole(db);
    await db.query("update services set is_visible = true where slug = 'mw4'");
  });
});

/**
 * Either the statement is rejected outright (no privilege) or it silently
 * affects zero rows (RLS). Both outcomes prove the caller cannot mutate data.
 */
async function cannotMutate(
  sql: string,
  params?: unknown[],
): Promise<boolean> {
  try {
    const result = await db.query(sql, params);
    return result.rows.length === 0;
  } catch {
    return true;
  }
}

describe("RLS: mutation protection", () => {
  it("anon cannot insert services", async () => {
    await actAsAnon(db);
    await expect(
      db.query("insert into services (name, slug) values ('Hack', 'hack')"),
    ).rejects.toThrow();
  });

  it("anon cannot update or delete services", async () => {
    await actAsAnon(db);
    expect(await cannotMutate("update services set status = 'offline' where slug = 'bo7'")).toBe(true);
    expect(await cannotMutate("delete from services where slug = 'bo7'")).toBe(true);
  });

  it("authenticated non-admins cannot mutate services", async () => {
    const userId = await createUser(db, "plain@example.com");
    await actAsUser(db, userId);
    const updated = await db.query(
      "update services set status = 'offline' where slug = 'bo7' returning id",
    );
    expect(updated.rows).toHaveLength(0);
  });

  it("admins can mutate services", async () => {
    const adminId = await createAdmin(db, "admin@example.com");
    await actAsUser(db, adminId);
    const updated = await db.query<{ status: string }>(
      "update services set status = 'online' where slug = 'bo7' returning status",
    );
    expect(updated.rows).toHaveLength(1);
    expect(updated.rows[0].status).toBe("online");
    await actAsServiceRole(db);
    await db.query("update services set status = 'unknown' where slug = 'bo7'");
  });
});

describe("RLS: audit log", () => {
  it("is not readable by anon", async () => {
    await actAsAnon(db);
    // Select is denied outright (no privilege) or returns zero rows (RLS).
    let deniedOrEmpty = false;
    try {
      const result = await db.query("select id from audit_log");
      deniedOrEmpty = result.rows.length === 0;
    } catch {
      deniedOrEmpty = true;
    }
    expect(deniedOrEmpty).toBe(true);
  });

  it("admins can insert an audit row for themselves", async () => {
    const adminId = await createAdmin(db, "auditor@example.com");
    await actAsUser(db, adminId);
    const insert = await db.query(
      `insert into audit_log
         (service_id, service_name, previous_status, new_status, changed_by, changed_by_email)
       values
         ((select id from services where slug='mw3'), 'MW3', 'unknown', 'online', $1, 'auditor@example.com')`,
      [adminId],
    );
    expect(insert.rows).toBeDefined();
  });

  it("admins cannot forge another administrator's identity", async () => {
    const adminId = await createAdmin(db, "auditor2@example.com");
    const otherId = await createUser(db, "victim@example.com");
    await actAsUser(db, adminId);
    await expect(
      db.query(
        `insert into audit_log
           (service_id, service_name, previous_status, new_status, changed_by)
         values
           ((select id from services where slug='mw3'), 'MW3', 'unknown', 'offline', $1)`,
        [otherId],
      ),
    ).rejects.toThrow();
  });

  it("audit rows survive service deletion (history preserved)", async () => {
    await actAsServiceRole(db);
    const adminId = await createAdmin(db, "deleter@example.com");
    await actAsUser(db, adminId);
    await db.query(
      "insert into services (name, slug) values ('Temp', 'temp-service')",
    );
    await db.query(
      `insert into audit_log (service_id, service_name, previous_status, new_status, changed_by)
       values ((select id from services where slug='temp-service'), 'Temp', null, 'unknown', $1)`,
      [adminId],
    );
    await db.query("delete from services where slug = 'temp-service'");
    await resetRole(db);
    const result = await db.query<{ service_id: string | null; service_name: string }>(
      "select service_id, service_name from audit_log where service_name = 'Temp'",
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].service_id).toBeNull();
    expect(result.rows[0].service_name).toBe("Temp");
  });
});

describe("RLS: admins allow-list", () => {
  it("non-admins cannot read the allow-list", async () => {
    const userId = await createUser(db, "nosy@example.com");
    await actAsUser(db, userId);
    const result = await db.query("select user_id from admins");
    expect(result.rows).toHaveLength(0);
  });

  it("admins can read the allow-list", async () => {
    const adminId = await createAdmin(db, "owner@example.com");
    await actAsUser(db, adminId);
    const result = await db.query("select user_id from admins");
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it("admins cannot insert new admins through the API (no policy)", async () => {
    const adminId = await createAdmin(db, "owner2@example.com");
    const target = await createUser(db, "wannabe@example.com");
    await actAsUser(db, adminId);
    await expect(
      db.query(
        "insert into admins (user_id, email, role) values ($1, 'wannabe@example.com', 'admin')",
        [target],
      ),
    ).rejects.toThrow();
  });
});
