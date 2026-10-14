"use client";
import { useEffect, useState, type ReactNode } from "react";
import BrandMark from "./brand-mark";
import SiteFooter from "./site-footer";
import FirstLesson from "./first-lesson";
import type { FirstLessonUnit } from "./first-lesson-types";
import { BooksContent, UnitsContent } from "./catalog-content";
import { LearningContext, initialProgress, readProgress, progressKey, type Tab, type UnitSummary } from "./learning-state";
const tabs = [
  ["home", "خانه", "🏠"], ["books", "کتاب‌ها", "📚"], ["lessons", "درس‌ها", "📖"],
  ["practice", "تمرین‌ها", "🎮"], ["videos", "ویدیوها", "🎬"], ["progress", "پیشرفت", "⭐"], ["parents", "والدین", "👨‍👩‍👧"],
] as const;
function readTab(): Tab {
  const value = new URLSearchParams(window.location.hash.slice(1)).get("tab");
  return value === "profiles" || value === "book" || value === "units" || tabs.some(([key]) => key === value) ? value as Tab : "home";
}
export default function SiteShell({ children, units, firstLessons }: { children: ReactNode; units: UnitSummary[]; firstLessons: FirstLessonUnit[] }) {
  const [today, setToday] = useState("");
  const [tab, setTab] = useState<Tab>("home");
  const [lesson, setLesson] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [progress, setProgress] = useState(initialProgress);
  useEffect(() => {
    const sync = () => {
      const next = readTab();
      const requestedLesson = new URLSearchParams(window.location.hash.slice(1)).get("lesson");
      setLesson(requestedLesson === "5" ? 5 : requestedLesson === "4" ? 4 : requestedLesson === "3" ? 3 : requestedLesson === "2" ? 2 : 1);
      setToday(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date()));
      const stored = readProgress();
      const unit = Number(new URLSearchParams(window.location.hash.slice(1)).get("u"));
      if (Number.isInteger(unit) && unit >= 1 && unit <= 15) stored.unit = unit;
      setTab(next); setProgress({ ...stored });
      document.body.dataset.theme = next === "book" || next === "units" ? "books" : next;
      try { localStorage.setItem(progressKey, JSON.stringify(stored)); } catch { /* Browsing still works without storage. */ }
    };
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("hashchange", sync); window.removeEventListener("storage", sync); };
  }, []);
  function go(next: Tab, unit?: number) {
    window.location.hash = `tab=${next}${unit ? `&u=${unit}` : ""}`;
    window.scrollTo(0, 0);
  }
  return <LearningContext.Provider value={{ units, progress, go, today }}><div id="app">
    <nav>
      <button className="brand" onClick={() => go("home")} aria-label="Kidotalks — خانه"><BrandMark /></button>
      {tabs.map(([key, label, icon]) => {
        const active = tab === key || (key === "books" && (tab === "book" || tab === "units"));
        return <button key={key} className={key === "parents" ? `tab parent-tab ${active ? "on" : ""}` : `tab${active ? " on" : ""}`} onClick={() => go(key)}>{`${icon} ${label}`}</button>;
      })}
      <button className="profile-badge" onClick={() => go("profiles")} aria-label="تغییر زبان‌آموز">🦊 زبان‌آموز من</button>
    </nav>
    {tab === "lessons" ? <FirstLesson key={progress.unit} unit={firstLessons[progress.unit - 1]} units={firstLessons} lesson={lesson} /> : <><header />
    <main className="in" tabIndex={-1}>
      {tab === "home" ? children : tab === "books" ? <BooksContent /> : tab === "book" || tab === "units" ? <UnitsContent /> : <p role="status">این بخش در حال آماده‌سازی است.</p>}
    </main></>}
    <SiteFooter />
  </div></LearningContext.Provider>;
}
