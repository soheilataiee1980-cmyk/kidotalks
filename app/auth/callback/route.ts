import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "../../../lib/supabase/env";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/account";
  return value;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  if (!code || !isSupabaseConfigured()) return NextResponse.redirect(new URL("/login?status=callback-error", request.url));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?status=callback-error", request.url));
  return NextResponse.redirect(new URL(next, request.url));
}
