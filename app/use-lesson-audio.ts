"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export function useLessonAudio(section = 1) {
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [lastSpoken, setLastSpoken] = useState("");
  const [audioStatus, setAudioStatus] = useState({ section, text: "" });
  const status = audioStatus.section === section ? audioStatus.text : "";
  function setStatus(text: string) { setAudioStatus({ section, text }); }
  const serial = useRef(0);
  const recording = useRef<HTMLAudioElement | null>(null);
  const attachRecording = useCallback((element: HTMLAudioElement | null) => { recording.current = element; }, []);
  function stop() {
    setStatus("");
    serial.current++;
    recording.current?.pause();
    window.speechSynthesis?.cancel();
  }
  useEffect(() => () => {
    serial.current++;
    window.speechSynthesis?.cancel();
  }, [section]);
  function speak(text: string, rate = speed) {
    setLastSpoken(text);
    stop();
    if (muted) { setStatus("صدا خاموش است."); return; }
    const current = serial.current;
    try {
      const speech = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = speech.getVoices().filter(v => /^en[-_]/i.test(v.lang));
      utterance.voice = voices.find(v => /zira|aria|jenny|samantha|susan|female/i.test(v.name)) || voices[0] || null;
      utterance.lang = "en-US";
      utterance.rate = .82 * rate;
      utterance.onend = () => { if (current === serial.current) setStatus("پخش تمام شد."); };
      utterance.onerror = () => { if (current === serial.current) setStatus("صدای انگلیسی دستگاه در دسترس نیست؛ تنظیمات صدای انگلیسی مرورگر یا دستگاه را بررسی کن."); };
      speech.speak(utterance);
      setStatus("پخش با صدای دستگاه");
    } catch { setStatus("پخش صدا در این مرورگر در دسترس نیست."); }
  }
  function toggleMute() {
    stop(); setMuted(!muted);
    setStatus(muted ? "صدا روشن شد." : "صدا خاموش شد.");
  }
  function changeSpeed(value: string) {
    const next = value === "0.75" ? .75 : 1;
    setSpeed(next);
    if (recording.current) recording.current.playbackRate = next;
    if (lastSpoken) speak(lastSpoken, next);
  }
  return { muted, speed, lastSpoken, status, attachRecording, stop, speak, toggleMute, changeSpeed };
}
