"use client";
/* eslint-disable @next/next/no-img-element -- Match the prototype's word art and image markup. */
import { useEffect, useMemo, useRef, useState } from "react";
import type { CourseUnit, Word } from "../data/types";
import { useLearning } from "./learning-state";
import { useLessonAudio } from "./use-lesson-audio";
import MemoryGame from "./memory-game";
import ProfileAvatar from "./profile-avatar";

export type PracticeUnit = Pick<CourseUnit, "id" | "title" | "icon" | "words">;
const EMPTY_WORDS: Word[] = [];

function picture(word: Word) {
  if (word.svg) return <span className="pic" aria-hidden="true" dangerouslySetInnerHTML={{ __html: word.svg }} />;
  if (word.imageFile) return <span className="pic"><img className="word-art" src={`/assets/words/${word.imageFile}`} alt="" loading="lazy" decoding="async" /></span>;
  if (word.emoji) return <span className="pic" aria-hidden="true">{word.emoji}</span>;
  return <span className="pic en" aria-hidden="true">{word.en}</span>;
}

function shuffle<T,>(items: T[]) {
  return [...items].map((item) => [Math.random(), item] as const).sort((a, b) => a[0] - b[0]).map(([, item]) => item);
}

function stars(count: number) {
  return <span className="rating" role="img" aria-label={`${count} از ۵ ستاره`}>{Array.from({ length: 5 }, (_, i) => <span key={i} aria-hidden="true" className={i < count ? "earned" : "empty"}>★</span>)}</span>;
}

export default function MatchingExercise({ units, unit, onUnitChange }: { units: PracticeUnit[]; unit: PracticeUnit; onUnitChange: (id: number) => void }) {
  const { go } = useLearning();
  const audio = useLessonAudio(1);
  const [playing, setPlaying] = useState(false);
  const [activity, setActivity] = useState<"matching" | "memory" | null>(null);
  const [round, setRound] = useState(0);
  const [rounds, setRounds] = useState<Word[][]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(() => new Set());
  const [missed, setMissed] = useState<Set<string>>(() => new Set());
  const [status, setStatus] = useState("");
  const [done, setDone] = useState(false);
  const [bestStars, setBestStars] = useState(0);
  const timer = useRef<number | null>(null);
  const total = unit?.words.length ?? 0;
  const currentRound = rounds[round] ?? EMPTY_WORDS;
  const left = useMemo(() => shuffle(rounds[round] ?? EMPTY_WORDS), [rounds, round]);
  const right = useMemo(() => shuffle(rounds[round] ?? EMPTY_WORDS), [rounds, round]);
  const accuracy = total ? Math.round(((total - missed.size) / total) * 100) : 0;
  const scoreStars = accuracy === 100 ? 5 : accuracy >= 80 ? 4 : accuracy >= 60 ? 3 : accuracy >= 40 ? 2 : 1;

  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); window.speechSynthesis?.cancel(); }, []);

  function begin() {
    setActivity("matching");
    const chunks: Word[][] = [];
    for (let i = 0; i < unit.words.length; i += 4) chunks.push(unit.words.slice(i, i + 4));
    setRounds(chunks);
    setRound(0);
    setSelected(null);
    setMatched(new Set());
    setMissed(new Set());
    setStatus("");
    setDone(false);
    setPlaying(true);
  }

  function leave() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    audio.stop();
    setPlaying(false);
    setActivity(null);
    setDone(false);
    setStatus("");
  }

  function choosePicture(word: Word) {
    if (matched.has(word.en) || done) return;
    setSelected(word.en);
    audio.speak(word.en, 0.85);
  }

  function chooseWord(word: Word) {
    if (!selected || matched.has(word.en) || done) return;
    if (selected !== word.en) {
      setMissed((previous) => new Set(previous).add(selected));
      setStatus("کلمهٔ دیگری را امتحان کن.");
      return;
    }

    const next = new Set(matched).add(selected);
    setMatched(next);
    setSelected(null);
    if (next.size === currentRound.length) {
      timer.current = window.setTimeout(() => {
        if (round + 1 < rounds.length) {
          setRound((value) => value + 1);
          setMatched(new Set());
          setSelected(null);
        } else {
          const resultAccuracy = Math.round(((total - missed.size) / total) * 100);
          const resultStars = resultAccuracy === 100 ? 5 : resultAccuracy >= 80 ? 4 : resultAccuracy >= 60 ? 3 : resultAccuracy >= 40 ? 2 : 1;
          setBestStars((value) => Math.max(value, resultStars));
          window.scrollTo(0, 0);
          setDone(true);
        }
      }, 600);
    }
  }

  const unitSwitch = <div className="unit-switch course-switch" aria-label="انتخاب یونیت">
    <button className="ghost" onClick={() => go("book")}>📚 کتاب و یونیت‌ها</button>
    <label htmlFor="course-unit">یونیت من</label>
    <select className="en" id="course-unit" value={unit.id} onChange={(event) => onUnitChange(Number(event.target.value))}>
      {units.map((item) => <option key={item.id} value={item.id}>{`Unit ${item.id} · ${item.title.en}`}</option>)}
    </select>
    <div className="row"><button disabled={unit.id === 1} onClick={() => onUnitChange(unit.id - 1)} aria-label="یونیت قبلی">قبلی</button><button disabled={unit.id === 15} onClick={() => onUnitChange(unit.id + 1)} aria-label="یونیت بعدی">بعدی</button></div>
  </div>;
  const toolbar = <div className="audio-toolbar" aria-label="کنترل صدا"><button id="audio-mute" onClick={audio.toggleMute}>{audio.muted ? "🔇 روشن‌کردن صدا" : "🔊 خاموش‌کردن صدا"}</button><button id="audio-repeat" onClick={() => audio.speak(audio.lastSpoken)} disabled={!audio.lastSpoken}>تکرار صدا</button><label>سرعت <select id="audio-speed" value={audio.speed} onChange={event => audio.changeSpeed(event.target.value)}><option value="1">معمولی</option><option value="0.75">آهسته</option></select></label><span id="audio-status" role="status" aria-live="polite">{audio.status}</span></div>;

  if (!total) return <><header /><main className="in" tabIndex={-1}>{unitSwitch}<p role="status">برای این یونیت واژه‌ای برای این بازی موجود نیست.</p>{toolbar}</main></>;

  if (activity === "memory") return <MemoryGame units={units} unit={unit} onUnitChange={onUnitChange} onBack={() => setActivity(null)} />;

  if (!playing) return <><header /><main className="in" tabIndex={-1}>{unitSwitch}<div className="activity-grid">
    <button className="activity-tile" onClick={begin}><span aria-hidden="true">🔗</span><b>وصل کن</b><small>تصویر و کلمه را وصل کن.</small></button>
    <button className="activity-tile" onClick={() => setActivity("memory")}><span aria-hidden="true">🧠</span><b>بازی حافظه</b><small>جفتِ تصویر و کلمه را پیدا کن.</small></button>
  </div>{toolbar}</main></>;

  return <>
    <header><button className="ghost" onClick={leave}>برگشت ›</button></header>
    <main className="in narrow" tabIndex={-1}>
      {done ? <>
        <ProfileAvatar className="big-avatar game-result-avatar" />
        <h1>یک قدم جلو رفتی!</h1>
        <div className="stars">{stars(scoreStars)}</div>
        <p role="status">{`${total - missed.size} پاسخ مستقل از ${total} سؤال · ${accuracy}٪`}</p>
        <details className="quiet-details"><summary>امتیاز چگونه حساب می‌شود؟</summary><p>پاسخ بدون کمک در تلاش اول امتیاز دارد. بهترین نتیجهٔ قبلی حفظ می‌شود.</p></details>
        <div className="row"><button onClick={begin}>دوباره تمرین کن</button><button onClick={leave}>تمرین‌ها</button><button onClick={() => go("progress")}>کارنامه</button></div>
        {bestStars > 0 && <p className="sub">بهترین نتیجهٔ این بخش: {bestStars} از ۵ ستاره</p>}
      </> : <>
        <div className="progress-wrap"><div className="progress-caption"><span>پیشرفت</span><span>{`${Math.round((round / rounds.length) * 100)}٪`}</span></div><div className="bar" role="progressbar" aria-label="پیشرفت" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((round / rounds.length) * 100)}><i style={{ width: `${Math.round((round / rounds.length) * 100)}%` }} /></div></div>
        <h1>تصویر و کلمه را وصل کن</h1>
        <div className="course-pairs"><div>{left.map((word) => <button key={word.en} data-word={word.en} className={`pair-picture pic${selected === word.en ? " picked" : ""}`} aria-label={`تصویر ${word.fa}، ${word.en}`} aria-pressed={selected === word.en} disabled={matched.has(word.en)} onClick={() => choosePicture(word)}>{picture(word)}</button>)}</div><div>{right.map((word) => <button key={word.en} data-word={word.en} className="pair-word en" aria-label={`${word.en}، معنی ${word.fa}`} disabled={matched.has(word.en)} onClick={() => chooseWord(word)}>{word.en}</button>)}</div></div>
        <p id="m" role="status" aria-live="polite">{status}</p>
      </>}
      {toolbar}
    </main>
  </>;
}
