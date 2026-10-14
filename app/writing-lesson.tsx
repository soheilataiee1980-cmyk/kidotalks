"use client";
import { useEffect, useState } from "react";
import type { CourseUnit } from "../data/types";

const cleanCourse = (text: string) => text.replace(/[’‘]/g, "'");

export function SpeakingWritingLesson({ content, onOpenNotebook, onPractice, speak }: {
  content: CourseUnit["writing"];
  onOpenNotebook: () => void;
  onPractice: () => void;
  speak: (text: string) => void;
}) {
  return <>
    <section className="teacher-box">
      <span className="teacher-label">با هم یاد بگیریم</span>
      <h2>اول بگو، بعد بنویس</h2>
      <ol>
        <li>یکی از جمله‌های نمونه را گوش کن و بلند تکرار کن.</li>
        <li>{content.prompt}</li>
        <li>{content.mechanics}</li>
      </ol>
    </section>
    <div className="teacher-examples"><article>
      <p className="en" lang="en">{cleanCourse(content.sample)}</p>
      <p>یک نمونه برای شروع</p>
      <button onClick={() => speak(cleanCourse(content.sample))}>🔊 بشنو و تکرار کن</button>
    </article></div>
    <div className="lesson-actions">
      <button className="cta" onClick={onOpenNotebook}>دفتر نوشتن من</button>
      <button onClick={onPractice}>قبلش جمله‌سازی کنیم</button>
    </div>
  </>;
}

export default function WritingNotebook({ unitId, content, onEmptyRead, speak }: {
  unitId: number;
  content: CourseUnit["writing"];
  onEmptyRead: () => void;
  speak: (text: string) => void;
}) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("");
  const key = `kidotalk-writing-${unitId}`;

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try { setValue(window.localStorage.getItem(key) ?? ""); }
      catch { setValue(""); }
    });
    return () => { active = false; };
  }, [key]);

  function save() {
    try {
      window.localStorage.setItem(key, value);
      setStatus("نوشته‌ات ذخیره شد.");
    } catch {
      setStatus("ذخیره نشد؛ متن را کپی کن.");
    }
  }

  function read() {
    const text = value.trim();
    if (text) speak(text);
    else onEmptyRead();
  }

  return <>
    <h1>دفتر نوشتن من ✏️</h1>
    <p>{content.prompt}</p>
    <div className="lesson-note">{content.mechanics}</div>
    <label htmlFor="course-writing">جمله‌های من</label>
    <textarea id="course-writing" className="course-notebook en" maxLength={2000} placeholder="Write your sentences here..." value={value} onChange={event => { setValue(event.target.value); setStatus(""); }} />
    <div className="row">
      <button id="course-writing-save" onClick={save}>ذخیرهٔ نوشته</button>
      <button id="course-writing-read" onClick={read}>🔊 نوشته‌ام را بخوان</button>
    </div>
    <p id="course-writing-status" role="status">{status}</p>
    <details className="plan">
      <summary>جملهٔ نمونه</summary>
      <p className="reading en">{cleanCourse(content.sample)}</p>
    </details>
    <p>بازبینی با همراه: واژه‌ها درست نوشته شده‌اند؟ ساختار جمله با الگوی درس هماهنگ است؟ حرف بزرگ و نشانهٔ پایان را گذاشته‌ام؟</p>
    <p className="sub">این فعالیت آزاد است؛ صدای سایت متن را می‌خواند و درستی معنی یا گرامر را ارزیابی نمی‌کند. نوشته فقط در همین مرورگر ذخیره می‌شود.</p>
  </>;
}
