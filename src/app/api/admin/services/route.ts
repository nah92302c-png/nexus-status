import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { toApiErrorBody, statusForError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";
import { getServerSupabase } from "@/lib/supabase/server";
import { createService, listAllServices } from "@/lib/services/repository";
import { serviceCreateSchema, zodDetails } from "@/lib/validation";

export async function GET() {
  try {
    const client = await getServerSupabase();
    await requireAdmin(client);
    const services = await listAllServices(client);
    return NextResponse.json({ ok: true, data: services });
  } catch (error) {
    return NextResponse.json(toApiErrorBody(error), {
      status: statusForError(error),
    });
  }
}

export async function POST(request: Request) {
  try {
    const client = await getServerSupabase();
    const context = await requireAdmin(client);

    const limit = checkRateLimit(`admin:${context.user.id}`, 60, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "rate_limited",
            message: "Too many requests. Please wait a moment and try again.",
          },
        },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } },
      );
    }

    const body: unknown = await request.json();
    const parsed = serviceCreateSchema.safeParse(body);
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

    const created = await createService(client, parsed.data, context.user);
    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(toApiErrorBody(error), {
      status: statusForError(error),
    });
  }
}