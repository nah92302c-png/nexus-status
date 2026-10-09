import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError, fromDatabaseError } from "@/lib/errors";
import { slugify } from "@/lib/slug";
import type { AuditEntry, Service, ServiceStatus, StatusMode } from "@/lib/types";
import type {
  ServiceCreateInput,
  ServiceUpdateInput,
} from "@/lib/validation";

export const SERVICE_COLUMNS =
  "id,name,slug,description,icon_url,status,status_mode,status_source,announcement,sort_order,is_visible,created_at,updated_at,last_checked_at";

export const AUDIT_COLUMNS =
  "id,service_id,service_name,previous_status,new_status,changed_by,changed_by_email,changed_at,change_note";

export interface Actor {
  id: string;
  email: string | null;
}

function normalizeNullable(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

async function nextSortOrder(client: SupabaseClient): Promise<number> {
  const { data } = await client
    .from("services")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const current = (data as { sort_order?: number } | null)?.sort_order ?? 0;
  return current + 1;
}

async function insertAudit(
  client: SupabaseClient,
  entry: {
    service_id: string | null;
    service_name: string;
    previous_status: ServiceStatus | null;
    new_status: ServiceStatus;
    changed_by: string;
    changed_by_email: string | null;
    change_note: string | null;
  },
): Promise<void> {
  const { error } = await client.from("audit_log").insert(entry);
  if (error) throw fromDatabaseError(error);
}

/* --------------------------------- Reads --------------------------------- */

export async function listVisibleServices(
  client: SupabaseClient,
): Promise<Service[]> {
  const { data, error } = await client
    .from("services")
    .select(SERVICE_COLUMNS)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw fromDatabaseError(error);
  return (data ?? []) as Service[];
}

export async function listAllServices(
  client: SupabaseClient,
): Promise<Service[]> {
  const { data, error } = await client
    .from("services")
    .select(SERVICE_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw fromDatabaseError(error);
  return (data ?? []) as Service[];
}

export async function getServiceById(
  client: SupabaseClient,
  id: string,
): Promise<Service | null> {
  const { data, error } = await client
    .from("services")
    .select(SERVICE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw fromDatabaseError(error);
  return (data as Service | null) ?? null;
}

export interface AuditPage {
  items: AuditEntry[];
  total: number;
  limit: number;
  offset: number;
}

export async function listAudit(
  client: SupabaseClient,
  options: { limit?: number; offset?: number } = {},
): Promise<AuditPage> {
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);

  const { data, error, count } = await client
    .from("audit_log")
    .select(AUDIT_COLUMNS, { count: "exact" })
    .order("changed_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw fromDatabaseError(error);
  return {
    items: (data ?? []) as AuditEntry[],
    total: count ?? 0,
    limit,
    offset,
  };
}

/* -------------------------------- Mutations ------------------------------- */

export async function createService(
  client: SupabaseClient,
  input: ServiceCreateInput,
  actor: Actor,
): Promise<Service> {
  const slug = input.slug ?? slugify(input.name);
  if (!slug) {
    throw new AppError("invalid_input", "A valid slug could not be generated.");
  }

  const sortOrder = input.sort_order ?? (await nextSortOrder(client));

  const { data, error } = await client
    .from("services")
    .insert({
      name: input.name,
      slug,
      description: normalizeNullable(input.description),
      icon_url: normalizeNullable(input.icon_url),
      status: input.status,
      status_mode: input.status_mode,
      status_source: input.status_source,
      announcement: normalizeNullable(input.announcement),
      sort_order: sortOrder,
      is_visible: input.is_visible,
    })
    .select(SERVICE_COLUMNS)
    .single();

  if (error) throw fromDatabaseError(error);
  const created = data as Service;

  await insertAudit(client, {
    service_id: created.id,
    service_name: created.name,
    previous_status: null,
    new_status: created.status,
    changed_by: actor.id,
    changed_by_email: actor.email,
    change_note: "Service created",
  });

  return created;
}

export async function updateService(
  client: SupabaseClient,
  id: string,
  input: ServiceUpdateInput,
  actor: Actor,
  changeNote?: string | null,
): Promise<Service> {
  const existing = await getServiceById(client, id);
  if (!existing) {
    throw new AppError("not_found", "That service no longer exists.");
  }

  const patch: Record<string, unknown> = {};

  if (input.name !== undefined) patch.name = input.name;
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.description !== undefined)
    patch.description = normalizeNullable(input.description);
  if (input.icon_url !== undefined)
    patch.icon_url = normalizeNullable(input.icon_url);
  if (input.announcement !== undefined)
    patch.announcement = normalizeNullable(input.announcement);
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;
  if (input.is_visible !== undefined) patch.is_visible = input.is_visible;
  if (input.status_mode !== undefined)
    patch.status_mode = input.status_mode as StatusMode;
  if (input.status_source !== undefined)
    patch.status_source = input.status_source;
  if (input.status !== undefined) {
    patch.status = input.status;
    // A manual status change is always recorded as a manual source unless the
    // caller explicitly labels it otherwise.
    if (input.status_source === undefined) patch.status_source = "manual";
    if (input.status_mode === undefined) patch.status_mode = "manual";
  }

  if (Object.keys(patch).length === 0) {
    throw new AppError("invalid_input", "No changes were provided.");
  }

  const { data, error } = await client
    .from("services")
    .update(patch)
    .eq("id", id)
    .select(SERVICE_COLUMNS)
    .single();

  if (error) throw fromDatabaseError(error);
  const updated = data as Service;

  const statusChanged =
    input.status !== undefined && input.status !== existing.status;

  if (statusChanged) {
    await insertAudit(client, {
      service_id: updated.id,
      service_name: updated.name,
      previous_status: existing.status,
      new_status: updated.status,
      changed_by: actor.id,
      changed_by_email: actor.email,
      change_note: normalizeNullable(changeNote ?? input.change_note),
    });
  }

  return updated;
}

export async function deleteService(
  client: SupabaseClient,
  id: string,
  actor: Actor,
  changeNote?: string | null,
): Promise<{ id: string }> {
  const existing = await getServiceById(client, id);
  if (!existing) {
    throw new AppError("not_found", "That service no longer exists.");
  }

  // Record the deletion before removing the row. `service_id` becomes null via
  // ON DELETE SET NULL, but `service_name` preserves the history.
  await insertAudit(client, {
    service_id: existing.id,
    service_name: existing.name,
    previous_status: existing.status,
    new_status: existing.status,
    changed_by: actor.id,
    changed_by_email: actor.email,
    change_note: normalizeNullable(changeNote) ?? "Service deleted",
  });

  const { error } = await client.from("services").delete().eq("id", id);
  if (error) throw fromDatabaseError(error);

  return { id };
}

/** Persist a new display order. Only rows the caller may update are affected. */
export async function reorderServices(
  client: SupabaseClient,
  ids: string[],
): Promise<void> {
  for (let index = 0; index < ids.length; index += 1) {
    const { error } = await client
      .from("services")
      .update({ sort_order: index + 1 })
      .eq("id", ids[index]);
    if (error) throw fromDatabaseError(error);
  }
}
