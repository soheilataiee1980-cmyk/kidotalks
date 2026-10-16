"use client";
/* eslint-disable @next/next/no-img-element -- Preserve the legacy lesson illustration markup. */
import { useEffect, useMemo, useRef, useState } from "react";
import type { PracticeUnit, OrderingSentence } from "./matching-exercise";
import type { Word } from "../data/types";
import { useLearning } from "./learning-state";
import { useLessonAudio } from "./use-lesson-audio";
import ProfileAvatar from "./profile-avatar";

function shuffle<T,>(items: T[]) {
  return [...items].map((item) => [Math.random(), item] as const).sort((a, b) => a[0] - b[0]).map(([, item]) => item);
}

function picture(word: Word | undefined) {
  if (!word) return null;
  if (word.svg) return <span className="pic" aria-hidden="true" dangerouslySetInnerHTML={{ __html: word.svg }} />;
  if (word.imageFile) return <span className="pic"><img className="word-art" src={`/assets/words/${word.imageFile}`} alt="" /></span>;
  if (word.emoji) return <span className="pic" aria-hidden="true">{word.emoji}</span>;
  return <span className="pic en" aria-hidden="true">{word.en}</span>;
}

function starRow(count: number) {
  return <span className="rating" role="img" aria-label={`${count} از ۵ ستاره`}>{Array.from({ length: 5 }, (_, i) => <span key={i} aria-hidden="true" className={i < count ? "earned" : "empty"}>★</span>)}</span>;
}

export default function OrderingExercise({ units, unit, onUnitChange, onBack }: { units: PracticeUnit[]; unit: PracticeUnit; onUnitChange: (id: number) => void; onBack: () => void }) {
  const { go } = useLearning();
  const audio = useLessonAudio(1);
  const sentences = unit.orderingSentences ?? [];
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [misses, setMisses] = useState<Set<number>>(() => new Set());
  const [status, setStatus] = useState("");
  const [done, setDone] = useState(false);
  const [bestStars, setBestStars] = useState(0);
  const [pieces, setPieces] = useState<number[]>(() => shuffle((sentences[0]?.en.split(" ") ?? []).map((_, i) => i)));
  const timer = useRef<number | null>(null);
  const current: OrderingSentence | undefined = sentences[index];
  const tokens = useMemo(() => current?.en.split(" ") ?? [], [current]);
  const autoCheck = unit.id === 1 || unit.id === 3;
  const image = current?.imageWord ? unit.words.find((word) => word.en === current.imageWord) : undefined;
  const accuracy = sentences.length ? Math.round(((sentences.length - misses.size) / sentences.length) * 100) : 0;
  const scoreStars = accuracy === 100 ? 5 : accuracy >= 80 ? 4 : accuracy >= 60 ? 3 : accuracy >= 40 ? 2 : 1;

  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); window.speechSynthesis?.cancel(); }, []);
  function restart() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    setIndex(0); setPieces(shuffle((sentences[0]?.en.split(" ") ?? []).map((_, i) => i))); setPicked([]); setMisses(new Set()); setStatus(""); setDone(false);
  }

  function back() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    audio.stop(); onBack();
  }

  function selectToken(tokenIndex: number) {
    if (!current || done || picked.includes(tokenIndex)) return;
    const next = [...picked, tokenIndex];
    setPicked(next);
    audio.speak(tokens[tokenIndex], 0.85);
    setStatus("");
    if (autoCheck && next.length === tokens.length) check(next);
  }

  function undo() {
    if (done) return;
    setPicked((previous) => previous.slice(0, -1));
    setStatus("");
  }

  function check(selection = picked) {
    if (!current || done) return;
    if (selection.length !== tokens.length) {
      setStatus("همهٔ کلمه‌ها را انتخاب کن.");
      return;
    }
    const answer = selection.map((tokenIndex) => tokens[tokenIndex]).join(" ");
    if (answer === current.en) {
      setStatus("آفرین! جمله درست است.");
      audio.speak(current.en);
      timer.current = window.setTimeout(() => {
        if (index + 1 < sentences.length) {
          setPieces(shuffle((sentences[index + 1]?.en.split(" ") ?? []).map((_, i) => i))); setIndex((previous) => previous + 1); setPicked([]); setStatus("");
        } else {
          setBestStars((previous) => Math.max(previous, scoreStars));
          window.scrollTo(0, 0); setDone(true);
        }
      }, 800);
      return;
    }
    const nextMisses = new Set(misses).add(index);
    setMisses(nextMisses);
    if (!autoCheck) setPicked([]);
    setStatus(unit.id === 3 ? "دوباره امتحان کن." : "جمله را دوباره بچین.");
    if (autoCheck) {
      timer.current = window.setTimeout(() => { setPicked([]); setStatus(""); }, unit.id === 1 ? 700 : 800);
    }
  }

  const unitSwitch = <div className="unit-switch course-switch" aria-label="انتخاب یونیت">
    <button className="ghost" onClick={() => go("book")}>📚 کتاب و یونیت‌ها</button>
    <label htmlFor="course-unit-order">یونیت من</label>
    <select className="en" id="course-unit-order" value={unit.id} onChange={(event) => onUnitChange(Number(event.target.value))}>
      {units.map((item) => <option key={item.id} value={item.id}>{`Unit ${item.id} · ${item.title.en}`}</option>)}
    </select>
    <div className="row"><button disabled={unit.id === 1} onClick={() => onUnitChange(unit.id - 1)} aria-label="یونیت قبلی">قبلی</button><button disabled={unit.id === 15} onClick={() => onUnitChange(unit.id + 1)} aria-label="یونیت بعدی">بعدی</button></div>
  </div>;

  if (!sentences.length) return <><header><button className="ghost" onClick={back}>برگشت ›</button></header><main className="in narrow" tabIndex={-1}>{unitSwitch}<p role="status">برای این یونیت، تمرین مرتب‌کردن واژه‌های جمله در نمونه وجود ندارد.</p></main></>;

  return <>
    <header><button className="ghost" onClick={back}>برگشت ›</button></header>
    <main className="in narrow ordering-game" tabIndex={-1}>
      {unitSwitch}
      {done ? <>
        <ProfileAvatar className="big-avatar game-result-avatar" />
        <h1>یک قدم جلو رفتی!</h1>
        <div className="stars">{starRow(scoreStars)}</div>
        <p role="status">{`${sentences.length - misses.size} پاسخ مستقل از ${sentences.length} جمله · ${accuracy}٪`}</p>
        <p className="sub">جمله‌ها را با واژه‌های همین یونیت مرتب کردی.</p>
        <div className="row"><button onClick={restart}>دوباره تمرین کن</button><button onClick={back}>تمرین‌ها</button><button onClick={() => go("progress")}>کارنامه</button></div>
        {bestStars > 0 && <p className="sub">بهترین نتیجهٔ این بخش: {bestStars} از ۵ ستاره</p>}
      </> : <>
        <div className="progress-wrap"><div className="progress-caption"><span>پیشرفت</span><span>{`${Math.round((index / sentences.length) * 100)}٪`}</span></div><div className="bar" role="progressbar" aria-label="پیشرفت" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((index / sentences.length) * 100)}><i style={{ width: `${Math.round((index / sentences.length) * 100)}%` }} /></div></div>
        {unit.id === 1 ? <p className="sub en">Make a sentence · جمله را بساز</p> : unit.id === 3 ? <p>جمله را از چپ به راست بساز.</p> : <h1>جمله را بساز</h1>}
        {image ? <div className="big pic ordering-picture">{picture(image)}</div> : current?.fa && <p className="ordering-meaning">{current.fa}</p>}
        <div className="slots en" dir="ltr" aria-label="جایگاه جمله" aria-live="polite">{picked.map((tokenIndex, slot) => <span key={`${tokenIndex}-${slot}`}>{tokens[tokenIndex]}</span>)}</div>
        <div className="row en ordering-token-list" dir="ltr">{pieces.map((tokenIndex) => <button key={tokenIndex} data-token-index={tokenIndex} className="course-piece" disabled={picked.includes(tokenIndex)} onClick={() => selectToken(tokenIndex)}>{tokens[tokenIndex]}</button>)}</div>
        {!autoCheck && <div className="row ordering-controls"><button onClick={undo} disabled={!picked.length}>یک کلمه برگرد</button><button onClick={() => check()}>بررسی جمله</button></div>}
        <p role="status" aria-live="polite" className="ordering-feedback">{status}</p>
      </>}
      <div className="audio-toolbar" aria-label="کنترل صدا"><button onClick={audio.toggleMute}>{audio.muted ? "🔇 روشن‌کردن صدا" : "🔊 خاموش‌کردن صدا"}</button><button onClick={() => audio.speak(audio.lastSpoken)} disabled={!audio.lastSpoken}>تکرار صدا</button><label>سرعت <select value={audio.speed} onChange={event => audio.changeSpeed(event.target.value)}><option value="1">معمولی</option><option value="0.75">آهسته</option></select></label><span role="status" aria-live="polite">{audio.status}</span></div>
    </main>
  </>;
}
