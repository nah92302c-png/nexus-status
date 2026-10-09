"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Service, ServiceStatus, StatusMode } from "@/lib/types";
import { SERVICE_STATUSES, STATUS_MODES, STATUS_META } from "@/lib/types";
import { getBrowserSupabase } from "@/lib/supabase/client";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_LABEL,
  SERVICE_ICONS_BUCKET,
  buildImagePath,
  isAcceptedImageType,
} from "@/lib/storage";
import { cn } from "@/lib/cn";

interface ServiceFormProps {
  mode: "create" | "edit";
  service?: Service;
}

type ServerBody = { ok?: boolean; error?: { message?: string; details?: Record<string, string[]> } };

function Field({
  label,
  id,
  hint,
  error,
  children,
}: {
  label: string;
  id: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-300">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      {error ? (
        <p role="alert" className="mt-1 text-xs text-rose-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-app-border bg-app-surface px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-app-accent focus:outline-none focus:ring-2 focus:ring-app-accent/30";

export function ServiceForm({ mode, service }: ServiceFormProps) {
  const router = useRouter();
  const [name, setName] = useState(service?.name ?? "");
  const [slug, setSlug] = useState(service?.slug ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [iconUrl, setIconUrl] = useState(service?.icon_url ?? "");
  const [status, setStatus] = useState<ServiceStatus>(service?.status ?? "unknown");
  const [statusMode, setStatusMode] = useState<StatusMode>(
    service?.status_mode ?? "manual",
  );
  const [statusSource, setStatusSource] = useState(service?.status_source ?? "manual");
  const [announcement, setAnnouncement] = useState(service?.announcement ?? "");
  const [isVisible, setIsVisible] = useState(service?.is_visible ?? true);
  const [changeNote, setChangeNote] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so selecting the same file again still fires `change`.
    event.target.value = "";
    if (!file) return;

    setUploadError(null);

    if (!isAcceptedImageType(file.type)) {
      setUploadError("Choose a PNG, JPG, WEBP, GIF or AVIF image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError(`Image must be ${MAX_IMAGE_LABEL} or smaller.`);
      return;
    }

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setUploadError("Uploads are unavailable because Supabase is not configured.");
      return;
    }

    setUploading(true);
    try {
      const path = buildImagePath(file.name);
      const { error } = await supabase.storage
        .from(SERVICE_ICONS_BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
      if (error) throw error;

      const { data } = supabase.storage
        .from(SERVICE_ICONS_BUCKET)
        .getPublicUrl(path);
      setIconUrl(data.publicUrl);
    } catch {
      setUploadError(
        "Upload failed. Make sure the service-icons storage bucket and its policies exist (see migration 0004).",
      );
    } finally {
      setUploading(false);
    }
  };

  const payload = () => ({
    name: name.trim() || undefined,
    slug: slug.trim() || undefined,
    description: description.trim() === "" ? null : description.trim(),
    icon_url: iconUrl.trim() === "" ? null : iconUrl.trim(),
    status,
    status_mode: statusMode,
    status_source: statusSource.trim(),
    announcement: announcement.trim() === "" ? null : announcement.trim(),
    is_visible: isVisible,
    ...(mode === "edit" ? { change_note: changeNote.trim() || null } : {}),
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);

    const endpoint =
      mode === "create"
        ? "/api/admin/services"
        : `/api/admin/services/${service?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const body: ServerBody = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (body?.error?.details) setFieldErrors(body.error.details);
        setFormError(body?.error?.message ?? "The request failed. Please try again.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setFormError("The request could not be completed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {formError ? (
        <p
          role="alert"
          className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
        >
          {formError}
        </p>
      ) : null}

      <Field
        label="Name"
        id="field-name"
        error={fieldErrors.name?.[0]}
      >
        <input
          id="field-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClass}
          placeholder="e.g. MW3"
          required
        />
      </Field>

      <Field
        label="Slug"
        id="field-slug"
        hint="Lowercase letters, numbers and hyphens. Leave empty to auto-generate from the name."
        error={fieldErrors.slug?.[0]}
      >
        <input
          id="field-slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          className={inputClass}
          placeholder="e.g. mw3"
        />
      </Field>

      <Field label="Description" id="field-description" error={fieldErrors.description?.[0]}>
        <textarea
          id="field-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          className={inputClass}
          placeholder="Short public description (optional)"
        />
      </Field>

      <div>
        <span className="mb-1 block text-sm font-medium text-slate-300">
          Image
        </span>
        <div className="flex flex-col gap-3 rounded-xl border border-app-border bg-app-surface p-3.5 sm:flex-row sm:items-start">
          <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-app-border bg-app-surface-2">
            {iconUrl ? (
              // Admin-supplied URLs may point at any host; a plain <img> keeps
              // them working without configuring next/image remote patterns.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={iconUrl}
                alt="Current service image preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="px-2 text-center text-[11px] text-slate-500">
                No image
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <label
                className={cn(
                  "inline-flex cursor-pointer items-center rounded-lg border border-app-border bg-app-surface-2 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-500",
                  uploading && "cursor-wait opacity-60",
                )}
              >
                {uploading
                  ? "Uploading…"
                  : iconUrl
                    ? "Replace image"
                    : "Upload image"}
                <input
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  onChange={handleImageFile}
                  disabled={uploading}
                  className="sr-only"
                />
              </label>
              {iconUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    setIconUrl("");
                    setUploadError(null);
                  }}
                  className="text-xs font-medium text-rose-300 transition-colors hover:text-rose-200"
                >
                  Remove
                </button>
              ) : null}
            </div>

            <Field label="Or paste an image URL" id="field-icon" error={fieldErrors.icon_url?.[0]}>
              <input
                id="field-icon"
                type="url"
                value={iconUrl}
                onChange={(event) => setIconUrl(event.target.value)}
                className={inputClass}
                placeholder="https://… (optional)"
              />
            </Field>

            {uploadError ? (
              <p role="alert" className="text-xs text-rose-400">
                {uploadError}
              </p>
            ) : null}
            <p className="text-xs text-slate-500">
              Uploaded to your Supabase Storage bucket. PNG, JPG, WEBP, GIF or
              AVIF, up to {MAX_IMAGE_LABEL}. Square images look best.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Status" id="field-status" error={fieldErrors.status?.[0]}>
          <select
            id="field-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as ServiceStatus)}
            className={inputClass}
          >
            {SERVICE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_META[value].label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status mode" id="field-mode" error={fieldErrors.status_mode?.[0]}>
          <select
            id="field-mode"
            value={statusMode}
            onChange={(event) => setStatusMode(event.target.value as StatusMode)}
            className={inputClass}
          >
            {STATUS_MODES.map((value) => (
              <option key={value} value={value}>
                {value === "manual" ? "Manual (set by staff)" : "Automatic (from monitor)"}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Status source"
        id="field-source"
        hint='Where the status came from, e.g. "manual" or a monitor name.'
        error={fieldErrors.status_source?.[0]}
      >
        <input
          id="field-source"
          value={statusSource}
          onChange={(event) => setStatusSource(event.target.value)}
          className={inputClass}
          placeholder="manual"
        />
      </Field>

      <Field label="Announcement" id="field-announcement" error={fieldErrors.announcement?.[0]}>
        <textarea
          id="field-announcement"
          value={announcement}
          onChange={(event) => setAnnouncement(event.target.value)}
          rows={2}
          className={inputClass}
          placeholder="Public note shown on the dashboard (optional)"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={isVisible}
          onChange={(event) => setIsVisible(event.target.checked)}
          className="h-4 w-4 rounded border-app-border accent-cyan-500"
        />
        Visible on the public dashboard
      </label>

      {mode === "edit" ? (
        <Field
          label="Change note"
          id="field-note"
          hint="Optional note recorded in the audit log for this change."
          error={fieldErrors.change_note?.[0]}
        >
          <textarea
            id="field-note"
            value={changeNote}
            onChange={(event) => setChangeNote(event.target.value)}
            rows={2}
            className={inputClass}
            placeholder="e.g. provider reported an outage"
          />
        </Field>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading
            ? "Uploading…"
            : submitting
              ? "Saving…"
              : mode === "create"
                ? "Create service"
                : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          disabled={submitting}
          className={cn(
            "rounded-lg border border-app-border px-4 py-2.5 text-sm text-slate-300 transition-colors hover:text-white disabled:opacity-50",
          )}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}