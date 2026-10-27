import { redirect } from "next/navigation";
import AuthCard, { AuthSetupMessage } from "../auth/auth-ui";
import { signOutParentAction } from "../auth/actions";
import { isSupabaseConfigured } from "../../lib/supabase/env";
import { getCurrentParent } from "../../lib/supabase/session";

export default async function ParentAccountPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  if (!isSupabaseConfigured()) return <AuthCard title="حساب والد" description="وضعیت اتصال حساب"><AuthSetupMessage /></AuthCard>;
  const parent = await getCurrentParent();
  if (!parent) redirect("/login");
  const { status } = await searchParams;
  return <AuthCard title="حساب والد" description="حساب شما با موفقیت وارد شده است.">
    {status === "password-updated" && <p className="auth-notice success" role="status">رمز عبور با موفقیت تغییر کرد.</p>}
    <p>ایمیل حساب:</p><p className="auth-account-email">{parent.email}</p>
    <p className="sub">پروفایل‌های فرزند، خرید دوره و گزارش پیشرفت در مرحله‌های بعدی اضافه می‌شوند.</p>
    <form className="auth-form" action={signOutParentAction}><button className="cta auth-submit" type="submit">خروج از حساب</button></form>
  </AuthCard>;
}
