"use client";
import type { FirstLessonUnit } from "./first-lesson-types";

/** Same display-only apostrophe normalization as the prototype's cleanCourse. */
const cleanCourse = (text: string) => text.replace(/[’‘]/g, "'");

export default function SentenceLesson({ content, speak }: {
  content: FirstLessonUnit["sentenceLesson"];
  speak: (text: string) => void;
}) {
  if (!content.tips.length || !content.models.length) {
    return <p role="status">محتوای این بخش در نمونه موجود نیست.</p>;
  }
  return <>
    <section className="teacher-box">
      <span className="teacher-label">با هم یاد بگیریم</span>
      <h2>با واژه‌ها جمله بسازیم</h2>
      <ol>{content.tips.map((tip, i) => <li key={i}>{tip}</li>)}</ol>
    </section>
    <div className="teacher-examples">{content.models.map(({ en, fa }, i) => <article key={i}>
      <p className="en" lang="en">{cleanCourse(en)}</p>
      <p>{fa}</p>
      <button onClick={() => speak(cleanCourse(en))}>🔊 بشنو و تکرار کن</button>
    </article>)}</div>
    <div className="your-turn"><b>حالا نوبت توست</b><p>یکی از مثال‌ها را بلند بگو. سپس یک واژه را با واژهٔ دیگری از همین یونیت عوض کن.</p></div>
  </>;
}
