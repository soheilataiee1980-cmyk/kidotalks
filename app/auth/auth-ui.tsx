import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthCard({ title, description, children, footer }: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return <section className="auth-card" aria-labelledby="auth-title">
    <Link className="auth-home" href="/">بازگشت به خانه</Link>
    <div className="auth-heading"><span className="auth-icon" aria-hidden="true">👨‍👩‍👧</span><div><h1 id="auth-title">{title}</h1><p>{description}</p></div></div>
    {children}
    {footer && <div className="auth-footer">{footer}</div>}
  </section>;
}

export function AuthSetupMessage() {
  return <p className="auth-notice" role="status">برای فعال‌شدن این بخش، آدرس پروژه و کلید عمومی Supabase را در `.env.local` و تنظیمات Vercel وارد کنید.</p>;
}
