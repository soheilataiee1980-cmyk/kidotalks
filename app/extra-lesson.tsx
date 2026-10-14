"use client";

import type { FirstLessonUnit } from "./first-lesson-types";

export default function ExtraLesson({ unit, onPractice, speak }: {
  unit: FirstLessonUnit;
  onPractice: () => void;
  speak: (text: string) => void;
}) {
  const extra = unit.extra;

  if (!extra) {
    return <>
      <section className="teacher-box">
        <span className="teacher-label">با هم یاد بگیریم</span>
        <h2>جمع کنیم</h2>
        <ol>
          <li>اشیا را بشمار؛ با plus جمع و با equals جواب را بگو.</li>
        </ol>
      </section>
      <div className="teacher-examples">
        <article>
          <p className="en" lang="en">Two plus one equals three.</p>
          <p>دو به‌اضافهٔ یک برابر با سه است.</p>
          <button onClick={() => speak("Two plus one equals three.")}>🔊 بشنو و تکرار کن</button>
        </article>
      </div>
      <button onClick={onPractice}>بازی جمع</button>
    </>;
  }

  return <>
    <section className="teacher-box">
      <span className="teacher-label">با هم یاد بگیریم</span>
      <h2>{extra.title}</h2>
      <ol>
        <li>{extra.fa}</li>
      </ol>
    </section>
    <p className="reading en">{extra.text}</p>
    {extra.project && <p>{extra.project}</p>}
  </>;
}