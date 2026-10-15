"use client";
/* eslint-disable @next/next/no-img-element -- Word artwork uses the existing generated assets. */
import { useEffect, useRef, useState } from "react";
import type { Word } from "../data/types";
import { useLearning } from "./learning-state";
import { useLessonAudio } from "./use-lesson-audio";
import ProfileAvatar from "./profile-avatar";
import type { PracticeUnit } from "./matching-exercise";

type Face = "visual" | "word";
interface MemoryCard { id: number; word: Word; face: Face }

function shuffle<T,>(items: T[]) {
  return [...items].map(item => [Math.random(), item] as const).sort((a, b) => a[0] - b[0]).map(([, item]) => item);
}

function picture(word: Word) {
  if (word.svg) return <span className="pic" aria-hidden="true" dangerouslySetInnerHTML={{ __html: word.svg }} />;
  if (word.imageFile) return <span className="pic"><img className="word-art" src={`/assets/words/${word.imageFile}`} alt="" loading="lazy" decoding="async" /></span>;
  if (word.emoji) return <span className="pic" aria-hidden="true">{word.emoji}</span>;
  return <span className="pic en" aria-hidden="true">{word.en}</span>;
}

function stars(count: number) {
  return <span className="rating" role="img" aria-label={`${count} از ۵ ستاره`}>{Array.from({ length: 5 }, (_, index) => <span key={index} aria-hidden="true" className={index < count ? "earned" : "empty"}>★</span>)}</span>;
}

export default function MemoryGame({ units, unit, onUnitChange, onBack }: { units: PracticeUnit[]; unit: PracticeUnit; onUnitChange: (id: number) => void; onBack: () => void }) {
  const { go } = useLearning();
  const audio = useLessonAudio(unit.id);
  const [started, setStarted] = useState(false);
  const [deck, setDeck] = useState<MemoryCard[]>([]);
  const [opened, setOpened] = useState<Set<number>>(() => new Set());
  const [matched, setMatched] = useState<Set<number>>(() => new Set());
  const [found, setFound] = useState(0);
  const [status, setStatus] = useState("");
  const [complete, setComplete] = useState(false);
  const [bestStars, setBestStars] = useState(0);
  const openedRef = useRef<number[]>([]);
  const busyRef = useRef(false);
  const timeout = useRef<number | null>(null);
  const pairCount = Math.min(4, unit.words.length);
  const toolbar = <div className="audio-toolbar" aria-label="کنترل صدا"><button id="audio-mute" onClick={audio.toggleMute}>{audio.muted ? "🔇 روشن‌کردن صدا" : "🔊 خاموش‌کردن صدا"}</button><button id="audio-repeat" onClick={() => audio.speak(audio.lastSpoken)} disabled={!audio.lastSpoken}>تکرار صدا</button><label>سرعت <select id="audio-speed" value={audio.speed} onChange={event => audio.changeSpeed(event.target.value)}><option value="1">معمولی</option><option value="0.75">آهسته</option></select></label><span id="audio-status" role="status" aria-live="polite">{audio.status}</span></div>;

  useEffect(() => () => {
    if (timeout.current !== null) window.clearTimeout(timeout.current);
    window.speechSynthesis?.cancel();
  }, []);

  function begin() {
    if (timeout.current !== null) window.clearTimeout(timeout.current);
    const words = shuffle(unit.words).slice(0, pairCount);
    const cards = shuffle(words.flatMap(word => [
      { id: 0, word, face: "visual" as const },
      { id: 0, word, face: "word" as const },
    ])).map((card, id) => ({ ...card, id }));
    openedRef.current = [];
    busyRef.current = false;
    setDeck(cards);
    setOpened(new Set());
    setMatched(new Set());
    setFound(0);
    setStatus("");
    setComplete(false);
    setStarted(true);
  }

  function leave() {
    if (timeout.current !== null) window.clearTimeout(timeout.current);
    busyRef.current = false;
    openedRef.current = [];
    audio.stop();
    setStarted(false);
    setComplete(false);
    setStatus("");
    onBack();
  }

  function flip(card: MemoryCard) {
    if (busyRef.current || matched.has(card.id) || openedRef.current.includes(card.id) || complete) return;
    const nextOpened = [...openedRef.current, card.id];
    openedRef.current = nextOpened;
    setOpened(new Set(nextOpened));
    if (nextOpened.length === 1) return;

    const [firstId, secondId] = nextOpened;
    const first = deck[firstId];
    if (first.word.en === card.word.en) {
      openedRef.current = [];
      const nextMatched = new Set(matched).add(firstId).add(secondId);
      const nextFound = found + 1;
      setMatched(nextMatched);
      setFound(nextFound);
      setStatus("✓ یک جفت پیدا کردی!");
      audio.speak(card.word.en, 0.85);
      if (nextFound === pairCount) {
        timeout.current = window.setTimeout(() => {
          setBestStars(value => Math.max(value, 5));
          window.scrollTo(0, 0);
          setComplete(true);
        }, 1000);
      }
      return;
    }

    busyRef.current = true;
    setStatus("جای این دو کارت را به خاطر بسپار.");
    timeout.current = window.setTimeout(() => {
      const remaining = new Set(openedRef.current);
      remaining.delete(firstId);
      remaining.delete(secondId);
      openedRef.current = [];
      setOpened(remaining);
      setStatus("");
      busyRef.current = false;
    }, 1500);
  }

  const unitSwitch = <div className="unit-switch course-switch" aria-label="انتخاب یونیت">
    <button className="ghost" onClick={() => go("book")} type="button">📚 کتاب و یونیت‌ها</button>
    <label htmlFor="memory-unit">یونیت من</label>
    <select className="en" id="memory-unit" value={unit.id} onChange={event => onUnitChange(Number(event.target.value))}>
      {units.map(item => <option key={item.id} value={item.id}>{`Unit ${item.id} · ${item.title.en}`}</option>)}
    </select>
    <div className="row"><button disabled={unit.id === 1} onClick={() => onUnitChange(unit.id - 1)} aria-label="یونیت قبلی" type="button">قبلی</button><button disabled={unit.id === 15} onClick={() => onUnitChange(unit.id + 1)} aria-label="یونیت بعدی" type="button">بعدی</button></div>
  </div>;

  if (!started) return <><header><button className="ghost" onClick={onBack} type="button">برگشت ›</button></header><main className="in" tabIndex={-1}>{unitSwitch}<div className="activity-grid"><button className="activity-tile" onClick={begin} type="button"><span aria-hidden="true">🧠</span><b>بازی حافظه</b><small>جفتِ تصویر و کلمه را پیدا کن.</small></button></div>{toolbar}</main></>;

  return <>
    <header><button className="ghost" onClick={leave} type="button">برگشت ›</button></header>
    <main className="in narrow" tabIndex={-1}>
      {complete ? <>
        <ProfileAvatar className="big-avatar game-result-avatar" />
        <h1>جفت‌ها را پیدا کردی!</h1>
        <div className="stars">{stars(5)}</div>
        <p>بازی حافظه برای تمرین است؛ پیدا کردن کارت نادیده جریمه ندارد.</p>
        <details className="quiet-details"><summary>امتیاز چگونه حساب می‌شود؟</summary><p>پاسخ بدون کمک در تلاش اول امتیاز دارد. بهترین نتیجهٔ قبلی حفظ می‌شود.</p></details>
        <div className="row"><button onClick={begin} type="button">دوباره تمرین کن</button><button onClick={leave} type="button">تمرین‌ها</button><button onClick={() => go("progress")} type="button">کارنامه</button></div>
        {bestStars > 0 && <p className="sub">بهترین نتیجه: {bestStars} از ۵ ستاره</p>}
      </> : <>
        <h1>دوستِ تصویر را پیدا کن</h1>
        <p>یک تصویر و کلمهٔ آن یک جفت هستند.</p>
        <p id="memory-count" role="status" aria-live="polite">{found === 0 ? "۰" : found} از {pairCount} جفت</p>
        <div className="teacher-memory" aria-label="کارت‌های بازی حافظه">
          {deck.map(card => {
            const isOpen = opened.has(card.id) || matched.has(card.id);
            const label = card.face === "visual" ? `تصویر؛ ${card.word.fa}` : card.word.en;
            return <button key={card.id} className={`local-memory${isOpen ? " turned" : ""}${matched.has(card.id) ? " matched" : ""}`} data-index={card.id} data-pair={card.word.en} aria-label={isOpen ? label : `کارت بسته ${card.id + 1}`} disabled={matched.has(card.id)} onClick={() => flip(card)} type="button">
              {isOpen ? card.face === "visual" ? picture(card.word) : <span className="en">{card.word.en}</span> : <span aria-hidden="true">?</span>}
            </button>;
          })}
        </div>
        <p id="m" className="answer-feedback" role="status" aria-live="polite">{status}</p>
      </>}
      {toolbar}
    </main>
  </>;
}
