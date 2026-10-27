"use client";
import BrandMark from "./brand-mark";
import { useLearning } from "./learning-state";

export default function SiteFooter() {
  const { go } = useLearning();
  return (
    <footer className="site-footer">
      <a href="#tab=home" aria-label="کیدوتاکس — خانه" className="footer-logo" onClick={(event) => { event.preventDefault(); go("home"); }}><BrandMark /></a>
      <div className="footer-links">
        <details><summary>ارتباط با ما</summary><p>اطلاعات تماس به‌زودی اضافه می‌شود.</p></details>
        <details><summary>دربارهٔ ما</summary><p>کیدوتاکس برای یادگیری انگلیسی کودکان فارسی‌زبان ۵ تا ۸ سال طراحی شده است.</p></details>
      </div>
      <section aria-label="شبکه‌های اجتماعی"><h2>شبکه‌های اجتماعی</h2><p>نشانی صفحات رسمی به‌زودی اضافه می‌شود.</p></section>
      <section className="footer-trust" aria-label="محل نماد اعتماد الکترونیکی"><h2>نماد اعتماد الکترونیکی</h2><p>نماد معتبر پس از دریافت، اینجا نمایش داده می‌شود.</p></section>
    </footer>
  );
}
