import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { toApiErrorBody, statusForError } from "@/lib/errors";
import { getServerSupabase } from "@/lib/supabase/server";
import { deleteService, updateService } from "@/lib/services/repository";
import { serviceUpdateSchema, zodDetails } from "@/lib/validation";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/services/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const client = await getServerSupabase();
    const context = await requireAdmin(client);

    const body: unknown = await request.json();
    const parsed = serviceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "invalid_input",
            message: "The submitted service data is not valid.",
            details: zodDetails(parsed.error),
          },
        },
        { status: 400 },
      );
    }

    const updated = await updateService(
      client,
      id,
      parsed.data,
      context.user,
      parsed.data.change_note ?? null,
    );
    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return NextResponse.json(toApiErrorBody(error), {
      status: statusForError(error),
    });
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/admin/services/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const client = await getServerSupabase();
    const context = await requireAdmin(client);

    const deleted = await deleteService(client, id, context.user);
    return NextResponse.json({ ok: true, data: deleted });
  } catch (error) {
    return NextResponse.json(toApiErrorBody(error), {
      status: statusForError(error),
    });
  }
}