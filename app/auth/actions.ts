"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthActionState } from "./auth-types";
import { getSupabaseConfig, isSupabaseConfigured } from "../../lib/supabase/env";
import { createSupabaseServerClient } from "../../lib/supabase/server";

const emailSchema = z.string().trim().email("نشانی ایمیل را درست وارد کنید.").max(254, "نشانی ایمیل بیش از حد طولانی است.");
const passwordSchema = z.string().min(8, "رمز عبور باید دست‌کم ۸ نویسه باشد.").max(128, "رمز عبور بیش از حد طولانی است.");
const credentialsSchema = z.object({ email: emailSchema, password: passwordSchema });
const signupSchema = credentialsSchema.extend({ confirmPassword: z.string() }).refine(value => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "تکرار رمز عبور با رمز اصلی یکسان نیست.",
});

function readString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

async function appOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try { return new URL(configured).origin; } catch { /* Use the request host in local development. */ }
  }
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

function unavailable(): AuthActionState {
  return { status: "error", message: "ورود هنوز به Supabase وصل نشده است. تنظیمات محیطی پروژه را بررسی کنید." };
}

export async function signUpParentAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    email: readString(formData, "email"),
    password: readString(formData, "password"),
    confirmPassword: readString(formData, "confirmPassword"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "اطلاعات واردشده را بررسی کنید." };
  if (!isSupabaseConfigured()) return unavailable();

  const supabase = await createSupabaseServerClient();
  const origin = await appOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/account` },
  });
  if (error) return { status: "error", message: "ثبت‌نام انجام نشد. تنظیمات ایمیل یا اطلاعات واردشده را بررسی کنید." };
  if (data.session) redirect("/account");
  return { status: "success", message: "اگر ثبت‌نام کامل شده باشد، پیوند تأیید به ایمیل شما فرستاده می‌شود. پس از تأیید وارد شوید." };
}

export async function signInParentAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({ email: readString(formData, "email"), password: readString(formData, "password") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "اطلاعات واردشده را بررسی کنید." };
  if (!isSupabaseConfigured()) return unavailable();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email.toLowerCase(), password: parsed.data.password });
  if (error) return { status: "error", message: "ورود انجام نشد. ایمیل و رمز عبور را بررسی کنید." };
  redirect("/account");
}

export async function requestPasswordResetAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse(readString(formData, "email"));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "ایمیل را بررسی کنید." };
  if (!isSupabaseConfigured()) return unavailable();

  const supabase = await createSupabaseServerClient();
  const origin = await appOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.toLowerCase(), {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  if (error) return { status: "error", message: "ارسال ایمیل بازیابی ممکن نشد. کمی بعد دوباره تلاش کنید." };
  return { status: "success", message: "اگر این ایمیل در سامانه ثبت شده باشد، پیوند بازیابی برایش فرستاده می‌شود." };
}

export async function updatePasswordAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = z.object({ password: passwordSchema, confirmPassword: z.string() }).refine(value => value.password === value.confirmPassword, {
    path: ["confirmPassword"], message: "تکرار رمز عبور با رمز اصلی یکسان نیست.",
  }).safeParse({ password: readString(formData, "password"), confirmPassword: readString(formData, "confirmPassword") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "رمز عبور را بررسی کنید." };
  if (!isSupabaseConfigured()) return unavailable();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password");
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", message: "تغییر رمز انجام نشد. دوباره از پیوند بازیابی وارد شوید." };
  redirect("/account?status=password-updated");
}

export async function signOutParentAction() {
  if (getSupabaseConfig()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/login?status=signed-out");
}
