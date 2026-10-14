"use client";
/* eslint-disable @next/next/no-img-element -- Preserve the prototype's exact word-art markup and sizing. */
import { useRef, useState } from "react";
import type { Word } from "../data/types";
import type { FirstLessonUnit } from "./first-lesson-types";
import { useLearning } from "./learning-state";
import { useLessonAudio } from "./use-lesson-audio";

// This inserts only the trusted, static SVG from our typed word data, never archived lesson HTML.
function Picture({ word, flash = false, onClick }: { word: Word; flash?: boolean; onClick?: () => void }) {
  const Tag = flash ? "button" : "span";
  const svg = !word.imageFile && word.svg;
  const props = { className: flash ? "flash-art pic" : "pic", "aria-label": flash ? `تلفظ ${word.en}` : undefined, onClick };
  if (svg) return <Tag {...props} dangerouslySetInnerHTML={{ __html: svg }} />;
  return <Tag {...props}>{word.imageFile ? <img className="word-art" src={`/assets/words/${word.imageFile}`} alt="" loading="lazy" decoding="async" /> : word.emoji}</Tag>;
}
const icons = ["🖼️", "💬", "🧸", "🔤", "📖", "✍️", "⭐"];
export default function FirstLesson({ unit, units }: { unit: FirstLessonUnit; units: FirstLessonUnit[] }) {
  const { go } = useLearning();
  const [card, setCard] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [recordingError, setRecordingError] = useState("");
  const menu = useRef<HTMLDetailsElement>(null);
  const { attachRecording, ...audio } = useLessonAudio();
  const count = unit.id === 1 || unit.id === 3 ? 6 : 7;
  const sections = unit.sections.slice(0, count);
  const label = sections[0].label;
  const pending = () => { audio.stop(); setNotice("این بخش در حال آماده‌سازی است."); };
  function showCard(next: number | null) { audio.stop(); setNotice(""); setCard(next); window.scrollTo(0, 0); }
  const toolbar = <div className="audio-toolbar" aria-label="کنترل صدا"><button id="audio-mute" onClick={audio.toggleMute}>{audio.muted ? "🔇 روشن‌کردن صدا" : "🔊 خاموش‌کردن صدا"}</button><button id="audio-repeat" onClick={() => audio.speak(audio.lastSpoken)} disabled={!audio.lastSpoken}>تکرار صدا</button><label>سرعت <select value={audio.speed} onChange={e => audio.changeSpeed(e.target.value)}><option value="1">معمولی</option><option value="0.75">آهسته</option></select></label><span id="audio-status" role="status" aria-live="polite">{audio.status}</span></div>;
  const word = card === null ? null : unit.words[card];
  return <>
    <header>{card !== null && <button className="ghost" onClick={() => showCard(null)}>برگشت ›</button>}</header>
    <main className={`in${card !== null ? " narrow" : ""}`} tabIndex={-1}>
      {word ? <>
        <p className="sub">{`کارت ${card! + 1} از ${unit.words.length}`}</p><Picture word={word} flash onClick={() => audio.speak(word.en)} /><h1 className="en">{word.en}</h1><p>{word.fa}</p><div className="lesson-actions"><button disabled={card === 0} onClick={() => showCard(card! - 1)}>قبلی</button><button onClick={() => audio.speak(word.en)}>🔊 تلفظ</button><button className="cta" onClick={() => card === unit.words.length - 1 ? pending() : showCard(card! + 1)}>{card === unit.words.length - 1 ? "حالا تمرین کنیم" : "بعدی"}</button></div>
      </> : <>
        <details className="learning-menu" id="learning-menu" ref={menu} onKeyDown={e => { if (e.key === "Escape" && menu.current) { menu.current.open = false; menu.current.querySelector("summary")?.focus(); } }}><summary><span className="menu-hamburger" aria-hidden="true"><i /><i /><i /></span><span className="menu-summary-text"><b>درس‌ها و یونیت‌ها</b><small>{`یونیت ${unit.id} · ${label}`}</small></span><span className="menu-chevron" aria-hidden="true">⌄</span></summary><div className="learning-menu-body"><div className="menu-book"><span aria-hidden="true">📚</span><div><b className="en">Family and Friends 1</b><small>مسیر یادگیری خودت را انتخاب کن</small></div><button className="ghost" onClick={() => go("book")}>کتاب من</button></div><h2>{`درس‌های یونیت ${unit.id}`}</h2><div className="menu-lessons">{sections.map((section, i) => <button key={section.id} className={`menu-lesson ${i === 0 ? "selected" : ""}`} aria-current={i === 0 ? "page" : undefined} onClick={() => i === 0 ? (menu.current!.open = false) : pending()}><span className="menu-lesson-icon" aria-hidden="true">{icons[i]}</span><span><small>{`درس ${i + 1}`}</small><b>{i === 6 ? "تکمیلی" : section.label}</b></span><span className="menu-current">{i === 0 ? "اینجایی" : "←"}</span></button>)}</div><h2>یونیت‌های کتاب</h2><div className="menu-units">{units.map(u => <button key={u.id} className={`menu-unit ${u.id === unit.id ? "selected" : ""}`} aria-current={u.id === unit.id ? "page" : undefined} onClick={() => { menu.current!.open = false; setNotice(""); go("lessons", u.id); }}><span className="menu-unit-number">{u.id}</span><span><b className="en">{u.title.en}</b><small>{u.title.fa}</small><span className="menu-unit-meter" aria-hidden="true"><i style={{ width: "0%" }} /></span><small>{`0 از ${u.activityCount} تمرین`}</small></span></button>)}</div></div></details>
        <div className="lesson-heading"><small className="en">{`Unit ${unit.id} · ${unit.title.en}`}</small><h1>{label}</h1><span>{`درس 1 از ${count}`}</span></div>
        <div className="lesson-tabs" aria-label="درس‌ها">{sections.map((section, i) => <button key={section.id} className={i === 0 ? "current" : ""} aria-current={i === 0 ? "page" : undefined} onClick={() => i === 0 ? setNotice("") : pending()}>{`${i + 1} · ${i === 6 ? "تکمیلی" : section.label}`}</button>)}</div>
        <div className="lesson-modes" aria-label="بخش‌های همین درس"><button className="current" aria-pressed="true" onClick={() => setNotice("")}>۱. یاد بگیر</button><button aria-pressed="false" onClick={pending}>۲. ویدیو ببین</button><button aria-pressed="false" onClick={pending}>۳. تمرین کن</button></div>
        <section className="single-lesson" data-lesson="1"><section className="teacher-box"><span className="teacher-label">با هم یاد بگیریم</span><h2>{`امروز ${unit.words.length} واژه یاد می‌گیریم`}</h2><ol><li>به هر تصویر نگاه کن و دکمه‌اش را لمس کن تا نامش را بشنوی.</li><li>یک بار همراه صدا تکرار کن؛ بار دوم خودت نام تصویر را بگو.</li><li>وقتی آماده شدی، در تمرین تصویر را به کلمه وصل کن.</li></ol></section><div className="cards">{unit.words.map(w => <button className="wc" key={w.en} onClick={() => audio.speak(w.en)}><Picture word={w} /><b className="en">{w.en}</b><small>{w.fa}</small></button>)}</div><button onClick={() => showCard(0)}>🃏 کارت‌ها را یکی‌یکی ببین</button><div className="lesson-actions"><button className="cta" onClick={pending}>حالا تمرین کنیم</button><button onClick={pending}>ویدیوی همین درس</button><button className="ghost" onClick={pending}>همهٔ بازی‌ها</button></div></section>
        <div className="lesson-pagination"><button disabled>درس قبلی</button><span>{`1 / ${count}`}</span><button onClick={pending}>درس بعدی</button></div>
        {unit.id === 15 && <section className="plan" aria-label="صدای واژگان ساحل"><h2>🎧 واژگان ساحل را بشنو</h2><p>نمونهٔ صوتی ارسالی · حدود ۶ ثانیه · یونیت ۱۵</p><audio id="beach-audio" ref={attachRecording} controls preload="metadata" style={{ width: "100%" }} muted={audio.muted} onPlay={e => { window.speechSynthesis?.cancel(); e.currentTarget.playbackRate = audio.speed; }} onError={() => setRecordingError("فایل صوتی باز نشد؛ پوشهٔ assets را کنار index.html نگه دار.")}><source src="/assets/audio/beach-vocabulary.mp3" type="audio/mpeg" />مرورگر پخش صدا را پشتیبانی نمی‌کند.</audio><p id="beach-audio-status" role="status">{recordingError}</p><a className="course-link" href="/assets/audio/beach-vocabulary.mp3" download>دریافت فایل صوتی</a></section>}
      </>}
      {toolbar}
      {notice && <p className="toast" role="status" onClick={() => setNotice("")}>{notice}</p>}
    </main>
  </>;
}
