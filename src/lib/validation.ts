import { z } from "zod";
import { SERVICE_STATUSES, STATUS_MODES } from "./types";
import { SLUG_PATTERN } from "./slug";

/**
 * Input validation shared by the client (immediate feedback) and the server
 * (authoritative enforcement). The server always re-validates; client checks
 * are only a convenience.
 */

const HTTP_URL = /^https?:\/\/[^\s]+$/i;

function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer.`)
    .nullable()
    .optional()
    .transform((value) => (value === undefined || value === null || value === "" ? null : value));
}

function optionalSlug() {
  return z
    .string()
    .trim()
    .max(80)
    .regex(SLUG_PATTERN, "Use lowercase letters, numbers and single hyphens.")
    .optional();
}

function optionalIconUrl() {
  return z
    .string()
    .trim()
    .max(2048)
    .refine((value) => HTTP_URL.test(value), "Enter a valid http(s) image URL.")
    .nullable()
    .optional()
    .transform((value) => (value === undefined || value === null || value === "" ? null : value));
}

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const serviceCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  slug: optionalSlug(),
  description: optionalText(500),
  icon_url: optionalIconUrl(),
  status: z.enum(SERVICE_STATUSES).default("unknown"),
  status_mode: z.enum(STATUS_MODES).default("manual"),
  status_source: z.string().trim().max(80).default("manual"),
  announcement: optionalText(500),
  sort_order: z.coerce.number().int().min(0).max(100000).optional(),
  is_visible: z.boolean().default(true),
});

/**
 * Update schema. Fields are plain nullable/optional so that an absent key is
 * distinguishable from an explicit `null` (which clears a column). Normalising
 * empty strings to null happens in the repository, not here.
 */
export const serviceUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(80).optional(),
    slug: z
      .string()
      .trim()
      .max(80)
      .regex(SLUG_PATTERN, "Use lowercase letters, numbers and single hyphens.")
      .optional(),
    description: z.string().trim().max(500).nullable().optional(),
    icon_url: z
      .string()
      .trim()
      .max(2048)
      .refine((value) => HTTP_URL.test(value), "Enter a valid http(s) image URL.")
      .nullable()
      .optional(),
    status: z.enum(SERVICE_STATUSES).optional(),
    status_mode: z.enum(STATUS_MODES).optional(),
    status_source: z.string().trim().max(80).optional(),
    announcement: z.string().trim().max(500).nullable().optional(),
    sort_order: z.coerce.number().int().min(0).max(100000).optional(),
    is_visible: z.boolean().optional(),
    change_note: z.string().trim().max(500).nullable().optional(),
  })
  .refine(
    (value) =>
      Object.keys(value).some((key) => key !== "change_note"),
    { message: "Provide at least one field to update." },
  );

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
});

/* ---------------------- Stored-entity shapes (read APIs) ------------------- */

/** Shape of a stored service, as returned by the read APIs. */
export const serviceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80),
  slug: z.string().regex(SLUG_PATTERN),
  description: z.string().max(500).nullable(),
  icon_url: z.string().max(2048).nullable(),
  status: z.enum(SERVICE_STATUSES),
  status_mode: z.enum(STATUS_MODES),
  status_source: z.string().max(80),
  announcement: z.string().max(500).nullable(),
  sort_order: z.number().int().min(0).max(100000),
  is_visible: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  last_checked_at: z.string().datetime().nullable(),
});

/** Shape of a stored audit entry. */
export const auditEntrySchema = z.object({
  id: z.string().uuid(),
  service_id: z.string().uuid().nullable(),
  service_name: z.string().min(1).max(80),
  previous_status: z.enum(SERVICE_STATUSES).nullable(),
  new_status: z.enum(SERVICE_STATUSES),
  changed_by: z.string().nullable(),
  changed_by_email: z.string().nullable(),
  changed_at: z.string().datetime(),
  change_note: z.string().max(500).nullable(),
});

export const publicServicesResponseSchema = z.object({
  ok: z.literal(true),
  data: z.array(serviceSchema),
});

export const auditPageResponseSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    items: z.array(auditEntrySchema),
    total: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
  }),
});

export type ServiceCreateInput = z.input<typeof serviceCreateSchema>;
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/** Convert a ZodError into a `{ field: [messages] }` map for the API. */
export function zodDetails(error: z.ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_form";
    details[key] = [...(details[key] ?? []), issue.message];
  }
  return details;
}
