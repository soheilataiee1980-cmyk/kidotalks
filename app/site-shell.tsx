"use client";

import { useEffect, useState, type ReactNode } from "react";
import BrandMark from "./brand-mark";
import SiteFooter from "./site-footer";

const tabs = [
  ["home", "خانه", "🏠"],
  ["books", "کتاب‌ها", "📚"],
  ["lessons", "درس‌ها", "📖"],
  ["practice", "تمرین‌ها", "🎮"],
  ["videos", "ویدیوها", "🎬"],
  ["progress", "پیشرفت", "⭐"],
  ["parents", "والدین", "👨‍👩‍👧"],
] as const;

type Tab = (typeof tabs)[number][0] | "profiles";

function readTab(): Tab {
  const value = new URLSearchParams(window.location.hash.slice(1)).get("tab");
  return value === "profiles" || tabs.some(([key]) => key === value)
    ? (value as Tab)
    : "home";
}

export default function SiteShell({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<Tab>("home");

  useEffect(() => {
    const sync = () => {
      const next = readTab();
      setTab(next);
      document.body.dataset.theme = next;
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  function go(next: Tab) {
    window.location.hash = `tab=${next}`;
    window.scrollTo(0, 0);
  }

  return (
    <div id="app">
      <nav>
        <button className="brand" onClick={() => go("home")} aria-label="Kidotalks — خانه"><BrandMark /></button>
        {tabs.map(([key, label, icon]) => (
          <button key={key} className={key === "parents" ? `tab parent-tab ${tab === key ? "on" : ""}` : `tab${tab === key ? " on" : ""}`} onClick={() => go(key)}>{`${icon} ${label}`}</button>
        ))}
        <button className="profile-badge" onClick={() => go("profiles")} aria-label="تغییر زبان‌آموز">🦊 زبان‌آموز من</button>
      </nav>
      <header />
      {tab === "home" ? children : (
        <main className="in">
          <p role="status">این بخش در حال آماده‌سازی است.</p>
        </main>
      )}
      <SiteFooter />
    </div>
  );
}
