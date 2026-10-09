import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { toApiErrorBody, statusForError } from "@/lib/errors";
import { getServerSupabase } from "@/lib/supabase/server";
import { listAudit } from "@/lib/services/repository";

function parsePagination(url: string) {
  const params = new URL(url).searchParams;
  const rawLimit = Number(params.get("limit") ?? "25");
  const rawOffset = Number(params.get("offset") ?? "0");
  const limit = Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 25;
  const offset = Number.isFinite(rawOffset) ? Math.max(0, Math.floor(rawOffset)) : 0;
  return { limit, offset };
}

export async function GET(request: Request) {
  try {
    const client = await getServerSupabase();
    await requireAdmin(client);

    const { limit, offset } = parsePagination(request.url);
    const page = await listAudit(client, { limit, offset });
    return NextResponse.json({ ok: true, data: page });
  } catch (error) {
    return NextResponse.json(toApiErrorBody(error), {
      status: statusForError(error),
    });
  }
}