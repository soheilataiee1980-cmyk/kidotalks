import Link from "next/link";
import AuthForm from "../auth/auth-form";
import AuthCard from "../auth/auth-ui";
import { requestPasswordResetAction } from "../auth/actions";
import { isSupabaseConfigured } from "../../lib/supabase/env";

export default function ForgotPasswordPage() {
  const configured = isSupabaseConfigured();
  return <AuthCard title="بازیابی رمز عبور" description="ایمیل حساب والد را وارد کنید تا پیوند بازیابی برایتان فرستاده شود." footer={<Link href="/login">بازگشت به ورود</Link>}>
    <AuthForm mode="forgot" action={requestPasswordResetAction} buttonLabel="فرستادن پیوند بازیابی" configured={configured} />
  </AuthCard>;
}
