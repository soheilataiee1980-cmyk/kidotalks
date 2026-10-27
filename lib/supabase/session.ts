import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./env";
import { createSupabaseServerClient } from "./server";

export async function getCurrentParent(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}
