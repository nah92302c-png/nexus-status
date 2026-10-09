import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { toApiErrorBody, statusForError } from "@/lib/errors";
import { getServerSupabase } from "@/lib/supabase/server";
import { reorderServices } from "@/lib/services/repository";
import { reorderSchema, zodDetails } from "@/lib/validation";

/**
 * Persist a new display order. The client submits the full ordered list of ids
 * (1..n) so the resulting `sort_order` values are always consecutive.
 */
export async function POST(request: Request) {
  try {
    const client = await getServerSupabase();
    await requireAdmin(client);

    const body: unknown = await request.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "invalid_input",
            message: "The submitted order is not valid.",
            details: zodDetails(parsed.error),
          },
        },
        { status: 400 },
      );
    }

    await reorderServices(client, parsed.data.ids);
    return NextResponse.json({ ok: true, data: { reordered: parsed.data.ids.length } });
  } catch (error) {
    return NextResponse.json(toApiErrorBody(error), {
      status: statusForError(error),
    });
  }
}