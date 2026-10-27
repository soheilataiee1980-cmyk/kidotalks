import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "../auth/auth-form";
import AuthCard from "../auth/auth-ui";
import { signInParentAction } from "../auth/actions";
import { isSupabaseConfigured } from "../../lib/supabase/env";
import { getCurrentParent } from "../../lib/supabase/session";

const notices: Record<string, { tone: string; text: string }> = {
  "signed-out": { tone: "success", text: "از حساب والد خارج شدید." },
  "callback-error": { tone: "error", text: "پیوند ورود معتبر نبود یا منقضی شده است. دوباره تلاش کنید." },
};

// Auth pages read cookies and search parameters on every request, so they are
// allowed to block instead of producing a static shell (Next.js `instant`).
export const instant = false;

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const configured = isSupabaseConfigured();
  if (configured && await getCurrentParent()) redirect("/account");
  const { status } = await searchParams;
  const notice = status ? notices[status] : undefined;
  return <AuthCard title="ورود والد" description="برای ادامهٔ مدیریت یادگیری وارد حساب خود شوید." footer={<>حساب ندارید؟ <Link href="/signup">ثبت‌نام والد</Link></>}>
    {notice && <p className={`auth-notice ${notice.tone}`} role="status">{notice.text}</p>}
    <AuthForm mode="login" action={signInParentAction} buttonLabel="ورود" configured={configured} />
  </AuthCard>;
}
