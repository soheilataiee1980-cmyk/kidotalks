import Link from "next/link";
import AuthForm from "../auth/auth-form";
import AuthCard from "../auth/auth-ui";
import { signUpParentAction } from "../auth/actions";
import { isSupabaseConfigured } from "../../lib/supabase/env";
import { getCurrentParent } from "../../lib/supabase/session";
import { redirect } from "next/navigation";

export default async function SignupPage() {
  const configured = isSupabaseConfigured();
  if (configured && await getCurrentParent()) redirect("/account");
  return <AuthCard title="ثبت‌نام والد" description="یک حساب برای مدیریت مسیر یادگیری خانواده بسازید." footer={<>قبلاً حساب ساخته‌اید؟ <Link href="/login">ورود والد</Link></>}>
    <AuthForm mode="signup" action={signUpParentAction} buttonLabel="ساخت حساب والد" configured={configured} />
    <p className="sub" style={{ marginTop: 16 }}>برای امنیت، اطلاعات کودک را در این مرحله وارد نکنید.</p>
  </AuthCard>;
}
