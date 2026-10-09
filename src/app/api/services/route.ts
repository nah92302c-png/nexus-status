import { NextResponse } from "next/server";
import { getDemoServices } from "@/lib/demo-data";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { toApiErrorBody, statusForError } from "@/lib/errors";
import { getServerSupabase } from "@/lib/supabase/server";
import { listVisibleServices } from "@/lib/services/repository";

/**
 * Public read endpoint for visible services. Polled by the dashboard as a
 * Realtime fallback. Returns demo data in demo mode only.
 */
export async function GET() {
  try {
    if (isDemoMode() && !isSupabaseConfigured()) {
      return NextResponse.json({ ok: true, data: getDemoServices() });
    }

    const client = await getServerSupabase();
    const services = await listVisibleServices(client);
    return NextResponse.json({ ok: true, data: services });
  } catch (error) {
    return NextResponse.json(toApiErrorBody(error), {
      status: statusForError(error),
    });
  }
}