"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthAction, AuthActionState } from "./auth-types";
import { initialAuthActionState } from "./auth-types";

type Mode = "signup" | "login" | "forgot" | "reset";

const fields: Record<Mode, { name: string; label: string; type: "email" | "password"; autoComplete: string }[]> = {
  signup: [
    { name: "email", label: "ایمیل والد", type: "email", autoComplete: "email" },
    { name: "password", label: "رمز عبور (حداقل ۸ نویسه)", type: "password", autoComplete: "new-password" },
    { name: "confirmPassword", label: "تکرار رمز عبور", type: "password", autoComplete: "new-password" },
  ],
  login: [
    { name: "email", label: "ایمیل والد", type: "email", autoComplete: "email" },
    { name: "password", label: "رمز عبور", type: "password", autoComplete: "current-password" },
  ],
  forgot: [{ name: "email", label: "ایمیل والد", type: "email", autoComplete: "email" }],
  reset: [
    { name: "password", label: "رمز عبور تازه (حداقل ۸ نویسه)", type: "password", autoComplete: "new-password" },
    { name: "confirmPassword", label: "تکرار رمز عبور تازه", type: "password", autoComplete: "new-password" },
  ],
};

export default function AuthForm({ mode, action, buttonLabel, configured = true }: {
  mode: Mode;
  action: AuthAction;
  buttonLabel: string;
  configured?: boolean;
}) {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(action, initialAuthActionState);
  return <form className="auth-form" action={formAction}>
    {!configured && <p className="auth-notice" role="status">برای استفاده از ورود والد، متغیرهای Supabase را تنظیم کنید.</p>}
    {fields[mode].map(field => <label className="auth-field" key={field.name} htmlFor={field.name}>
      <span>{field.label}</span>
      <input id={field.name} name={field.name} type={field.type} autoComplete={field.autoComplete} required maxLength={field.type === "email" ? 254 : 128} dir={field.type === "email" ? "ltr" : "auto"} />
    </label>)}
    {state.message && <p className={`auth-notice ${state.status}`} role="status" aria-live="polite">{state.message}</p>}
    <button className="cta auth-submit" type="submit" disabled={pending}>{pending ? "کمی صبر کنید…" : buttonLabel}</button>
    {mode === "login" && <Link href="/forgot-password">رمز عبور را فراموش کرده‌اید؟</Link>}
  </form>;
}
