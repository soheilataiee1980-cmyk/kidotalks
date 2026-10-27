"use client";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import BrandMark from "./brand-mark";
import ProfileAvatar from "./profile-avatar";
import HomeArt from "./home-art";
import { useLearning } from "./learning-state";
export function BookCard() {
  const { go } = useLearning();
  return <div className="cards w2"><button className="act" style={{ "--c": "#e8ddff", padding: 24 } as CSSProperties} onClick={() => go("book")}><span className="ic">📚</span><span className="t"><b>Family and Friends 1</b><span>فمیلی اند فرندز ۱</span><br /><small>۱۵ یونیت · درس‌ها، تمرین‌ها و کارنامه ←</small></span></button></div>;
}
export function HomeContent() {
  const { go, progress, today } = useLearning();
  const router = useRouter();
  const done = progress.completedDay === today;
  return <>
    <section className="hero"><HomeArt /><div className="hero-brand"><BrandMark /></div><h1>سلام زبان‌آموز من <ProfileAvatar className="inline-profile-avatar" /></h1><div className="row"><button className="cta" onClick={() => go("lessons", progress.unit)}>ادامهٔ یادگیری</button><button onClick={() => go("practice")}>{done ? "مرور امروز" : "تمرین امروز"}</button></div><p>آخرین مسیر: <span className="en">{`Unit ${progress.unit}`}</span>{` · ${done ? "تمرین امروز انجام شده ✓" : "۶ سؤال کوتاه برای امروز"}`}</p></section>
    <div className="plans"><button className="plan" onClick={() => go("practice")}><b>🌱 مرور اشتباه‌های من</b><p>{`${progress.mistakesToReview} نکته برای مرور`}</p></button><button className="plan" onClick={() => go("progress")}><b>⭐ کارنامهٔ من</b></button><button className="plan" onClick={() => router.push("/login")}><b>👨‍👩‍👧 همراهِ یادگیری</b></button></div>
    <h2 className="sec">کتاب‌های من</h2><BookCard />
  </>;
}
export function BooksContent() {
  return <><h1>کتاب‌ها 📚</h1><p className="sub">کتابت را انتخاب کن و وارد دنیای درس‌ها و بازی‌هایش شو.</p><BookCard /></>;
}
const colors = ["#BFE0FF", "#BDF0DC", "#FFC9BB", "#D9CCFF", "#FFE9A3"];
export function UnitsContent() {
  const { units, go } = useLearning();
  return <>
    <button className="ghost" onClick={() => go("books")}>کتاب‌ها ›</button>
    <div className="banner"><span className="pic">📚</span><div><h1 className="en">Family and Friends 1</h1><p>۱۵ قدم برای یادگیری؛ یونیتت را انتخاب کن.</p></div></div>
    <div className="cards w2">{units.map((unit, i) => <button key={unit.id} className="act" style={{ "--c": colors[i % 5], padding: 22 } as CSSProperties} onClick={() => go("lessons", unit.id)}><span className="ic">{unit.icon}</span><span className="t"><b>{`Unit ${unit.id} · ${unit.title.en}`}</b><span>{unit.title.fa}</span><br /><small>درس، تمرین و کارنامه · ورود ←</small></span></button>)}</div>
  </>;
}
