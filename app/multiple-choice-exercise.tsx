"use client";
import { useEffect, useMemo, useState } from "react";
import type { Question } from "../data/types";
import ProfileAvatar from "./profile-avatar";

const star = (n: number) => {
  const value = Math.max(0, Math.min(5, Number(n) || 0));
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} aria-hidden="true" className={i < value ? "earned" : "empty"}>★</span>
  ));
};

const message = (accuracy: number, wrong: number, total: number) => {
  if (total === 0) return "تمرینی برای این بخش هنوز آماده نیست.";
  if (wrong === 0) return `${total} پاسخ درست · عالی بود!`;
  return `${total - wrong} پاسخ مستقل از ${total} سؤال · ${accuracy}٪`;
};

export default function MultipleChoiceExercise({
  questions,
  title = "پرسش‌های متن",
  speak,
}: {
  questions?: Question[] | null;
  title?: string;
  speak?: (text: string) => void;
}) {
  const items = useMemo(() => (Array.isArray(questions) ? questions : []), [questions]);
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState(() => new Set<number>());
  const [locked, setLocked] = useState(false);
  const [status, setStatus] = useState("");
  const [done, setDone] = useState(false);
  const [disabledChoices, setDisabledChoices] = useState<Set<number>>(new Set());
  const [bestStars, setBestStars] = useState(0);


  const total = items.length;
  const current = items[index];

  useEffect(() => {
    if (!current || done) return;
    if (current.audio && speak) speak(current.audio);
  }, [current, done, speak]);

  if (!total || !current) {
    return (
      <section className="teacher-box" aria-label={title}>
        <span className="teacher-label">تمرین پرسش‌ها</span>
        <h2>{title}</h2>
        <p role="status" className="sub">
          تمرینی برای این بخش هنوز آماده نیست.
        </p>
      </section>
    );
  }

  const options = current.options.map((option, i) => [
    option,
    current.optionHtml?.[i] ?? option,
  ]) as [string, string][];

  function answer(value: string, choiceIndex: number) {
    if (locked) return;
    if (value === current.answer) {
      setLocked(true);
      setStatus("آفرین!");
      if (current.answerAudio && speak) speak(current.answerAudio);
      else if (current.audio && speak) speak(current.answer);
      window.setTimeout(() => {
        if (index + 1 < total) {
          setIndex((value) => value + 1);
          setLocked(false);
          setDisabledChoices(new Set());
          setStatus("");
        } else {
          const wrongCount = wrong.size;
          const accuracy = Math.round(((total - wrongCount) / total) * 100);
          const stars = accuracy >= 100 ? 5 : accuracy >= 80 ? 4 : accuracy >= 60 ? 3 : accuracy >= 40 ? 2 : 1;
          setBestStars((old) => Math.max(old, stars));
          window.scrollTo(0, 0);
          setDone(true);
        }
      }, 900);
    } else {
      setWrong((prev) => {
        const next = new Set(prev);
        next.add(index);
        return next;
      });
      setDisabledChoices((prev) => {
        const next = new Set(prev);
        next.add(choiceIndex);
        return next;
      });
      setStatus("یک بار دیگر نگاه کن و امتحان کن.");
    }
  }

  function retry() {
    setIndex(0);
    setWrong(new Set());
    setLocked(false);
    setDisabledChoices(new Set());
    setStatus("");
    setDone(false);
  }

  if (done) {
    const wrongCount = wrong.size;
    const accuracy = Math.round(((total - wrongCount) / total) * 100);
    const stars = accuracy >= 100 ? 5 : accuracy >= 80 ? 4 : accuracy >= 60 ? 3 : accuracy >= 40 ? 2 : 1;
    return (
      <section className="teacher-box" aria-label={title}>
        <span className="teacher-label">تمرین پرسش‌ها</span>
        <h2>{title}</h2>
        <ProfileAvatar className="big-avatar game-result-avatar" />
        <h1 style={{ lineHeight: 1.35, margin: "0 0 12px" }}>یک قدم جلو رفتی!</h1>
        <div className="stars" style={{ justifyContent: "center", margin: "0 0 12px" }}>
          <span className="rating" role="img" aria-label={`${stars} از ۵ ستاره`}>
            {star(stars)}
          </span>
        </div>
        <p role="status" style={{ margin: "12px 0" }}>{message(accuracy, wrongCount, total)}</p>
        <details className="quiet-details">
          <summary>امتیاز چگونه حساب می‌شود؟</summary>
          <p>بهترین نتیجه حفظ می‌شود. ستاره‌ها بر اساس درصد پاسخ‌های درست حساب می‌شوند.</p>
        </details>
        <div className="row">
          <button className="cta" onClick={retry}>دوباره تمرین کن</button>
        </div>
        {bestStars > 0 && (
          <p className="sub">بهترین نتیجهٔ این بخش: {bestStars} از ۵ ستاره</p>
        )}
      </section>
    );
  }

  const progress = Math.round((index / total) * 100);

  return (
    <section className="teacher-box" aria-label={title}>
      <span className="teacher-label">تمرین پرسش‌ها</span>
      <h2>{title}</h2>
      <div className="quiz-heading">
        <span>{`سؤال ${index + 1} از ${total} · بدون عجله`}</span>
        <span>{bestStars > 0 ? `${bestStars} از ۵ ستاره` : ""}</span>
      </div>
      <div className="bar" aria-hidden="true">
        <i style={{ width: `${progress}%` }} />
      </div>
      {current.hint && <p className="question-instruction">{current.hint}</p>}
      {current.prompt && (
        <p className="question-instruction" style={{ textAlign: "left", direction: "ltr" }}>
          {current.prompt}
        </p>
      )}
      {current.sceneHtml && (
        <div
          className="big pic"
          dangerouslySetInnerHTML={{ __html: current.sceneHtml }}
        />
      )}
      <div id="m" role="status" aria-live="polite" className="sub">
        {status}
      </div>
      <div className={`opts g${options.length}`}>
        {options.map(([value, html], i) => (
          <button
            key={`${value}-${i}`}
            className="opt"
            disabled={locked || disabledChoices.has(i)}
            onClick={() => answer(value, i)}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ))}
      </div>
      <div className="lesson-actions">
        <button className="ghost" onClick={retry} disabled={index === 0 && wrong.size === 0}>
          دوباره از ابتدا
        </button>
      </div>
    </section>
  );
}
