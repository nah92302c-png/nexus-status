import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import {
  createService,
  deleteService,
  getServiceById,
  listVisibleServices,
  updateService,
} from "@/lib/services/repository";
import { createFakeClient, createFakeState } from "./helpers/fake-supabase";

const ACTOR = { id: "admin-1", email: "admin@example.com" };

function seedRow(state: ReturnType<typeof createFakeState>) {
  state.services.push({
    id: "service-1",
    name: "MW3",
    slug: "mw3",
    description: null,
    icon_url: null,
    status: "unknown",
    status_mode: "manual",
    status_source: "manual",
    announcement: null,
    sort_order: 1,
    is_visible: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    last_checked_at: null,
  });
}

describe("createService", () => {
  it("generates a slug, assigns the next sort order and records a creation audit", async () => {
    const state = createFakeState();
    seedRow(state);
    const client = createFakeClient(state);

    const created = await createService(
      client,
      { name: "ARC Raiders" },
      ACTOR,
    );

    expect(created.slug).toBe("arc-raiders");
    expect(created.sort_order).toBe(2);
    expect(state.services).toHaveLength(2);

    const audit = state.audit_log[0];
    expect(audit.service_name).toBe("ARC Raiders");
    expect(audit.previous_status).toBeNull();
    expect(audit.new_status).toBe("unknown");
    expect(audit.changed_by).toBe(ACTOR.id);
  });

  it("surfaces database unique-slug errors as a conflict AppError", async () => {
    const state = createFakeState();
    seedRow(state);
    const client = createFakeClient(state);

    await expect(
      createService(client, { name: "Duplicate", slug: "mw3" }, ACTOR),
    ).rejects.toMatchObject({ code: "conflict", status: 409 });
  });
});

describe("updateService", () => {
  it("records an audit entry only when the status actually changes", async () => {
    const state = createFakeState();
    seedRow(state);
    const client = createFakeClient(state);

    const result = await updateService(
      client,
      "service-1",
      { status: "online" },
      ACTOR,
    );
    expect(result.status).toBe("online");
    expect(state.audit_log).toHaveLength(1);
    expect(state.audit_log[0]).toMatchObject({
      service_id: "service-1",
      previous_status: "unknown",
      new_status: "online",
      changed_by: "admin-1",
    });

    // Same status again -> no new audit entry.
    await updateService(client, "service-1", { status: "online" }, ACTOR);
    expect(state.audit_log).toHaveLength(1);
  });

  it("stores a change note on the audit entry", async () => {
    const state = createFakeState();
    seedRow(state);
    const client = createFakeClient(state);

    await updateService(
      client,
      "service-1",
      { status: "offline", change_note: "provider outage" },
      ACTOR,
    );
    expect(state.audit_log[0].change_note).toBe("provider outage");
  });

  it("clears optional text when set to null", async () => {
    const state = createFakeState();
    seedRow(state);
    state.services[0].description = "old description";
    const client = createFakeClient(state);

    await updateService(client, "service-1", { description: null }, ACTOR);
    expect(state.services[0].description).toBeNull();
  });

  it("marks a manual status change as a manual source", async () => {
    const state = createFakeState();
    seedRow(state);
    const client = createFakeClient(state);

    await updateService(client, "service-1", { status: "degraded" }, ACTOR);
    expect(state.services[0].status_source).toBe("manual");
    expect(state.services[0].status_mode).toBe("manual");
  });

  it("throws not_found for a missing service", async () => {
    const state = createFakeState();
    const client = createFakeClient(state);
    await expect(
      updateService(client, "nope", { status: "online" }, ACTOR),
    ).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("deleteService", () => {
  it("audits before deletion and preserves the service name in history", async () => {
    const state = createFakeState();
    seedRow(state);
    const client = createFakeClient(state);

    await deleteService(client, "service-1", ACTOR);

    expect(state.services).toHaveLength(0);
    const audit = state.audit_log[0];
    expect(audit.service_name).toBe("MW3");
    expect(audit.previous_status).toBe("unknown");
    expect(audit.change_note).toBe("Service deleted");
  });

  it("throws not_found for a missing service", async () => {
    const state = createFakeState();
    const client = createFakeClient(state);
    await expect(deleteService(client, "nope", ACTOR)).rejects.toMatchObject({
      code: "not_found",
    });
  });
});

describe("reads", () => {
  it("listVisibleServices returns only visible rows", async () => {
    const state = createFakeState();
    seedRow(state);
    state.services.push({
      id: "service-2",
      name: "Hidden",
      slug: "hidden",
      status: "unknown",
      is_visible: false,
    });
    const client = createFakeClient(state);

    const visible = await listVisibleServices(client);
    expect(visible.map((s) => s.name)).toEqual(["MW3"]);
  });

  it("getServiceById returns the matching row or null", async () => {
    const state = createFakeState();
    seedRow(state);
    const client = createFakeClient(state);

    expect((await getServiceById(client, "service-1"))?.name).toBe("MW3");
    expect(await getServiceById(client, "missing")).toBeNull();
  });
});

describe("error mapping", () => {
  it("AppError instances surface with code and status", () => {
    const error = new AppError("forbidden", "Administrator access is required.");
    expect(error.status).toBe(403);
    expect(error.code).toBe("forbidden");
  });
});