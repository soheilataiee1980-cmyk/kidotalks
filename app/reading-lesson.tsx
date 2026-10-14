"use client";
import type { CourseUnit } from "../data/types";
import MultipleChoiceExercise from "./multiple-choice-exercise";

const cleanCourse = (text: string) => text.replace(/['`]/g, "'");

export default function ReadingLesson({ content, speak }: {
  content: CourseUnit["reading"];
  speak: (text: string) => void;
}) {
  return <>
    <section className="teacher-box">
      <span className="teacher-label">با هم یاد بگیریم</span>
      <h2>قدم‌به‌قدم متن را بفهمیم</h2>
      <ol>
        <li>اول یک بار متن را گوش کن یا آرام بخوان.</li>
        <li>بار دوم نام‌ها و واژه‌هایی را که بلدی پیدا کن.</li>
        <li>برای جواب هر سؤال، دوباره جملهٔ مربوط به آن را در متن بخوان.</li>
      </ol>
    </section>
    <article className="reading-panel">
      <p className="reading en" lang="en">{cleanCourse(content.text)}</p>
      <button onClick={() => speak(cleanCourse(content.text))}>🔊 شنیدن متن</button>
    </article>
    <MultipleChoiceExercise questions={content.questions} title="پرسش‌های متن" speak={speak} />
  </>;
}
