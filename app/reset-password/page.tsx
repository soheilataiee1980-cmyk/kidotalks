import Link from "next/link";
import AuthForm from "../auth/auth-form";
import AuthCard from "../auth/auth-ui";
import { updatePasswordAction } from "../auth/actions";
import { isSupabaseConfigured } from "../../lib/supabase/env";
import { getCurrentParent } from "../../lib/supabase/session";

export default async function ResetPasswordPage() {
  const configured = isSupabaseConfigured();
  const hasRecoverySession = configured && await getCurrentParent();
  return <AuthCard title="انتخاب رمز تازه" description="پس از بازکردن پیوند ایمیل، رمز تازهٔ حساب والد را تعیین کنید." footer={<Link href="/forgot-password">درخواست پیوند تازه</Link>}>
    {hasRecoverySession
      ? <AuthForm mode="reset" action={updatePasswordAction} buttonLabel="ذخیرهٔ رمز تازه" configured />
      : <p className="auth-notice" role="status">پیوند بازیابی معتبر پیدا نشد. از صفحهٔ بازیابی، پیوند تازه بفرستید.</p>}
  </AuthCard>;
}
