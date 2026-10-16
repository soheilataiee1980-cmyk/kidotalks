"use client";
/* eslint-disable @next/next/no-img-element -- Reuse the prototype's existing word artwork. */
import { useEffect, useRef, useState } from "react";
import type { Word } from "../data/types";
import type { PracticeUnit } from "./matching-exercise";
import { useLearning } from "./learning-state";
import { useLessonAudio } from "./use-lesson-audio";
import ProfileAvatar from "./profile-avatar";

function shuffle<T,>(items: T[]) {
  return [...items].map(item => [Math.random(), item] as const).sort((a, b) => a[0] - b[0]).map(([, item]) => item);
}

function picture(word: Word) {
  if (word.svg) return <span className="pic" aria-hidden="true" dangerouslySetInnerHTML={{ __html: word.svg }} />;
  if (word.imageFile) return <span className="pic"><img className="word-art" src={`/assets/words/${word.imageFile}`} alt="" /></span>;
  if (word.emoji) return <span className="pic" aria-hidden="true">{word.emoji}</span>;
  return <span className="pic en" aria-hidden="true">{word.en}</span>;
}

function starRow(count: number) {
  return <span className="rating" role="img" aria-label={`${count} از ۵ ستاره`}>{Array.from({ length: 5 }, (_, index) => <span key={index} aria-hidden="true" className={index < count ? "earned" : "empty"}>★</span>)}</span>;
}

function scoreFor(misses: number) {
  return misses === 0 ? 5 : misses <= 2 ? 4 : misses <= 4 ? 3 : misses <= 6 ? 2 : 1;
}

export default function SpellingExercise({ unit, onBack }: { unit: PracticeUnit; onBack: () => void }) {
  const { go } = useLearning();
  const audio = useLessonAudio(unit.id);
  const [words, setWords] = useState(() => shuffle(unit.words));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [missed, setMissed] = useState<Set<number>>(() => new Set());
  const [feedback, setFeedback] = useState("");
  const [locked, setLocked] = useState(false);
  const [complete, setComplete] = useState(false);
  const [bestStars, setBestStars] = useState(0);
  const timer = useRef<number | null>(null);
  const current = words[index];
  const total = words.length;
  const stars = scoreFor(missed.size);
  const accuracy = total ? Math.round(((total - missed.size) / total) * 100) : 0;
  const toolbar = <div className="audio-toolbar" aria-label="کنترل صدا"><button id="audio-mute" onClick={audio.toggleMute}>{audio.muted ? "🔇 روشن‌کردن صدا" : "🔊 خاموش‌کردن صدا"}</button><button id="audio-repeat" onClick={() => audio.speak(audio.lastSpoken)} disabled={!audio.lastSpoken}>تکرار صدا</button><label>سرعت <select id="audio-speed" value={audio.speed} onChange={event => audio.changeSpeed(event.target.value)}><option value="1">معمولی</option><option value="0.75">آهسته</option></select></label><span id="audio-status" role="status" aria-live="polite">{audio.status}</span></div>;

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    window.speechSynthesis?.cancel();
  }, []);

  function restart() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    setWords(shuffle(unit.words));
    setIndex(0);
    setAnswer("");
    setMissed(new Set());
    setFeedback("");
    setLocked(false);
    setComplete(false);
  }

  function back() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    audio.stop();
    onBack();
  }

  function check() {
    if (!current || locked || !answer.trim()) return;
    const normalized = answer.trim().toLowerCase().replace(/\s+/g, " ");
    if (normalized === current.en.toLowerCase()) {
      setLocked(true);
      audio.speak(current.en);
      timer.current = window.setTimeout(() => {
        if (index + 1 < total) {
          setIndex(value => value + 1);
          setAnswer("");
          setFeedback("");
          setLocked(false);
        } else {
          const resultStars = scoreFor(missed.size);
          setBestStars(value => Math.max(value, resultStars));
          window.scrollTo(0, 0);
          setComplete(true);
        }
      }, 800);
    } else {
      setMissed(previous => new Set(previous).add(index));
      setFeedback("یک بار دیگر گوش کن و بنویس.");
    }
  }

  return <>
    <header><button className="ghost" onClick={back} type="button">برگشت ›</button></header>
    <main className="in narrow spelling-game" tabIndex={-1}>
      {complete ? <>
        <ProfileAvatar className="big-avatar game-result-avatar" />
        <h1>یک قدم جلو رفتی!</h1>
        <div className="stars">{starRow(stars)}</div>
        <p role="status">{`${total - missed.size} پاسخ مستقل از ${total} واژه · ${accuracy}٪`}</p>
        <details className="quiet-details"><summary>امتیاز چگونه حساب می‌شود؟</summary><p>پاسخ بدون کمک در تلاش اول امتیاز دارد. بهترین نتیجهٔ قبلی حفظ می‌شود.</p></details>
        <div className="row"><button onClick={restart} type="button">دوباره تمرین کن</button><button onClick={back} type="button">تمرین‌ها</button><button onClick={() => go("progress")} type="button">کارنامه</button></div>
        {bestStars > 0 && <p className="sub">بهترین نتیجهٔ این بخش: {bestStars} از ۵ ستاره</p>}
      </> : current ? <>
        <div className="progress-wrap"><div className="progress-caption"><span>پیشرفت</span><span>{`${Math.round((index / total) * 100)}٪`}</span></div><div className="bar" role="progressbar" aria-label="پیشرفت" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((index / total) * 100)}><i style={{ width: `${Math.round((index / total) * 100)}%` }} /></div></div>
        <h1>کلمه را بنویس</h1>
        <div className="big pic spelling-picture" aria-label={`راهنمای تصویری: ${current.fa}`} role="img">{picture(current)}</div>
        <button onClick={() => audio.speak(current.en)} type="button">🔊 تلفظ</button>
        <label htmlFor="course-spelling">املای انگلیسی</label>
        <input id="course-spelling" className="en" dir="ltr" lang="en" autoComplete="off" spellCheck={false} maxLength={50} value={answer} disabled={locked} onChange={event => setAnswer(event.target.value)} onKeyDown={event => { if (event.key === "Enter") check(); }} />
        <button id="course-spell-check" onClick={check} disabled={locked} type="button">بررسی</button>
        <p id="course-feedback" role="status" aria-live="polite">{feedback}</p>
      </> : <p role="status">برای این یونیت واژه‌ای برای املا موجود نیست.</p>}
      {toolbar}
    </main>
  </>;
}
