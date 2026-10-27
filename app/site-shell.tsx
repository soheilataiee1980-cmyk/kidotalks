"use client";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import BrandMark from "./brand-mark";
import SiteFooter from "./site-footer";
import ProfileAvatar from "./profile-avatar";
import FirstLesson from "./first-lesson";
import type { FirstLessonUnit } from "./first-lesson-types";
import MatchingExercise, { type PracticeUnit } from "./matching-exercise";
import { BooksContent, UnitsContent } from "./catalog-content";
import { LearningContext, initialProgress, readProgress, readProfileAvatar, progressKey, DEFAULT_PROFILE_AVATAR, type ProfileAvatarId, type Tab, type UnitSummary } from "./learning-state";
const tabs = [
  ["home", "خانه", "🏠"], ["books", "کتاب‌ها", "📚"], ["lessons", "درس‌ها", "📖"],
  ["practice", "تمرین‌ها", "🎮"], ["videos", "ویدیوها", "🎬"], ["progress", "پیشرفت", "⭐"], ["parents", "والدین", "👨‍👩‍👧"],
] as const;
function readTab(): Tab {
  const value = new URLSearchParams(window.location.hash.slice(1)).get("tab");
  return value === "profiles" || value === "book" || value === "units" || tabs.some(([key]) => key === value) ? value as Tab : "home";
}
export default function SiteShell({ children, units, practiceUnits, firstLessons }: { children: ReactNode; units: UnitSummary[]; practiceUnits: PracticeUnit[]; firstLessons: FirstLessonUnit[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [today, setToday] = useState("");
  const [tab, setTab] = useState<Tab>("home");
  const [lesson, setLesson] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
  const [progress, setProgress] = useState(initialProgress);
  const [profileAvatar, setProfileAvatar] = useState<ProfileAvatarId>(DEFAULT_PROFILE_AVATAR);
  useEffect(() => {
    const sync = () => {
      const next = readTab();
      const requestedLesson = new URLSearchParams(window.location.hash.slice(1)).get("lesson");
      setLesson(requestedLesson === "7" ? 7 : requestedLesson === "6" ? 6 : requestedLesson === "5" ? 5 : requestedLesson === "4" ? 4 : requestedLesson === "3" ? 3 : requestedLesson === "2" ? 2 : 1);
      setToday(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date()));
      const stored = readProgress();
      setProfileAvatar(readProfileAvatar());
      const unit = Number(new URLSearchParams(window.location.hash.slice(1)).get("u"));
      if (Number.isInteger(unit) && unit >= 1 && unit <= 15) stored.unit = unit;
      setTab(next); setProgress({ ...stored });
      document.body.dataset.theme = next === "book" || next === "units" ? "books" : next;
      try { localStorage.setItem(progressKey, JSON.stringify(stored)); } catch { /* Browsing still works without storage. */ }
    };
    const onHashChange = () => { window.scrollTo({ top: 0 }); sync(); };
    sync();
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("hashchange", onHashChange); window.removeEventListener("storage", sync); };
  }, [pathname]);
  function go(next: Tab, unit?: number) {
    const hash = `tab=${next}${unit ? `&u=${unit}` : ""}`;
    // Auth pages share this shell; send their navigation back to the home route.
    if (pathname !== "/") { router.push(`/#${hash}`); return; }
    window.location.hash = hash;
    window.scrollTo(0, 0);
  }
  return <LearningContext.Provider value={{ units, progress, profileAvatar, go, today }}><div id="app">
    <nav aria-label="ناوبری اصلی">
      <button className="brand" onClick={() => go("home")} aria-label="Kidotalks — خانه"><BrandMark /></button>
      {tabs.map(([key, label, icon]) => {
        const active = tab === key || (key === "books" && (tab === "book" || tab === "units"));
        if (key === "parents") return <button key={key} className={`tab parent-tab${active ? " on" : ""}`} onClick={() => router.push("/login")}>{`${icon} ${label}`}</button>;
        return <button key={key} className={`tab${active ? " on" : ""}`} aria-current={active ? "page" : undefined} onClick={() => go(key)}>{`${icon} ${label}`}</button>;
      })}
      <button className="profile-badge" onClick={() => go("profiles")} aria-label="تغییر زبان‌آموز"><ProfileAvatar className="profile-badge-avatar" /> زبان‌آموز من</button>
    </nav>
    {tab === "lessons" ? <FirstLesson key={progress.unit} unit={firstLessons[progress.unit - 1]} units={firstLessons} lesson={lesson} /> : tab === "practice" ? <MatchingExercise key={progress.unit} units={practiceUnits} unit={practiceUnits[progress.unit - 1]} onUnitChange={unit => go("practice", unit)} /> : <><header />
    <main className="in" tabIndex={-1}>
      {tab === "home" ? children : tab === "books" ? <BooksContent /> : tab === "book" || tab === "units" ? <UnitsContent /> : <p role="status">این بخش در حال آماده‌سازی است.</p>}
    </main></>}
    <SiteFooter />
  </div></LearningContext.Provider>;
}
