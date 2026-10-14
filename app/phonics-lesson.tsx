"use client";
import type { CourseUnit } from "../data/types";

export default function PhonicsLesson({ content, speak }: {
  content: CourseUnit["phonics"];
  speak: (text: string) => void;
}) {
  const alphabet = content.mode === "alphabet";
  if (alphabet ? !content.alphabet : !content.items.length) {
    return <p role="status">محتوای این بخش در نمونه موجود نیست.</p>;
  }
  return <>
    <section className="teacher-box">
      <span className="teacher-label">با هم یاد بگیریم</span>
      <h2>{alphabet ? "حروف را به ترتیب بشناسیم" : "به صدای داخل کلمه گوش کنیم"}</h2>
      <ol>{(alphabet ? [
        "حرف بزرگ و کوچک، دو شکل یک حرف هستند.",
        "نام حروف را بگو و سپس حرف کوچکِ هرکدام را در تمرین پیدا کن.",
      ] : [
        "حرف یا ترکیب رنگی را در هر کلمه پیدا کن.",
        "دکمه تلفظِ کلمهٔ کامل را پخش می‌کند. کلمه را تکرار کن و به صدای بخش رنگی گوش بده.",
      ]).map(tip => <li key={tip}>{tip}</li>)}</ol>
    </section>
    {alphabet ? <div className="alphabet-course en">{[...content.alphabet!].map(letter =>
      <button key={letter} onClick={() => speak(letter)}>{`${letter} ${letter.toLowerCase()}`}</button>
    )}</div> : <div className="teacher-examples">{content.items.map(({ sound, word }, i) => {
      const at = word.indexOf(sound);
      return <article key={i}>
        <p className="en phonics-word">{word.slice(0, at)}<mark>{sound}</mark>{word.slice(at + sound.length)}</p>
        <button onClick={() => speak(word)}>{`🔊 ${word}`}</button>
      </article>;
    })}</div>}
  </>;
}
