import type { AuditEntry, Paginated } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatUtc } from "@/lib/format";
import { cn } from "@/lib/cn";

interface AuditTableProps {
  page: Paginated<AuditEntry>;
}

const linkClass =
  "rounded-lg border border-nexus-border px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-nexus-accent/50 hover:text-white disabled:pointer-events-none disabled:opacity-30";

/**
 * Append-only history of admin changes. Rendered server-side; pagination is
 * plain links, so the whole flow works without JavaScript.
 */
export function AuditTable({ page }: AuditTableProps) {
  const { items, total, limit, offset } = page;
  const nextOffset = offset + limit;
  const previousOffset = Math.max(0, offset - limit);
  const queryFor = (next: number) => `?limit=${limit}&offset=${next}`;

  return (
    <section aria-label="Audit log">
      <p className="mb-4 text-sm text-slate-400">
        {total} {total === 1 ? "entry" : "entries"} · showing{" "}
        {items.length === 0 ? 0 : offset + 1}–{offset + items.length}
      </p>

      {items.length === 0 ? (
        <p className="rounded-xl border border-nexus-border bg-nexus-surface p-6 text-center text-sm text-slate-400">
          No audit entries yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-nexus-border">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-nexus-border bg-nexus-surface-2 text-xs uppercase tracking-wide text-slate-400">
                <th scope="col" className="px-4 py-2.5 font-medium">
                  When
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Service
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Change
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  By
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Note
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((entry) => (
                <tr key={entry.id} className="border-b border-nexus-border last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                    {formatUtc(entry.changed_at)}
                  </td>
                  <td className="px-4 py-3 font-medium text-white">
                    {entry.service_name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      {entry.previous_status ? (
                        <StatusBadge status={entry.previous_status} size="sm" />
                      ) : (
                        <span className="rounded-full border border-slate-600/50 bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-400">
                          —
                        </span>
                      )}
                      <span aria-hidden="true" className="text-slate-500">
                        →
                      </span>
                      <StatusBadge status={entry.new_status} size="sm" />
                    </span>
                  </td>
                  <td data-testid="audit-actor" className="px-4 py-3 text-xs text-slate-400">
                    {entry.changed_by_email ?? entry.changed_by ?? "system"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {entry.change_note ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <nav
        aria-label="Audit pagination"
        className="mt-4 flex items-center justify-end gap-3"
      >
        <a
          aria-disabled={offset === 0}
          href={queryFor(previousOffset)}
          className={cn(linkClass, offset === 0 && "pointer-events-none opacity-30")}
        >
          ← Previous
        </a>
        <a
          aria-disabled={nextOffset >= total}
          href={queryFor(nextOffset)}
          className={cn(
            linkClass,
            nextOffset >= total && "pointer-events-none opacity-30",
          )}
        >
          Next →
        </a>
      </nav>
    </section>
  );
}