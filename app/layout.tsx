/* eslint-disable @next/next/no-css-tags -- Serve the verbatim prototype CSS without loader transformations. */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/vazirmatn/arabic-400.css";
import "@fontsource/vazirmatn/arabic-700.css";
import "@fontsource/vazirmatn/arabic-800.css";
import "@fontsource/vazirmatn/arabic-900.css";
import "@fontsource/fredoka/latin-400.css";
import "@fontsource/fredoka/latin-700.css";
import "@fontsource/vazirmatn/arabic-500.css";
import "@fontsource/vazirmatn/arabic-600.css";
import "@fontsource/fredoka/latin-500.css";
import "@fontsource/fredoka/latin-600.css";
import SiteShell from "./site-shell";
import { courseUnits } from "../data";


import "./footer.css";

const legacyUnit1Order = [
  ["pen", "It's a pen."], ["ruler", "It's a ruler."], ["eraser", "It's an eraser."],
  ["book", "This is a book."], ["bag", "This is my bag."], ["window", "Open the window."],
] as const;
const legacyUnit3Order = [
  ["nose", "This is my nose."], ["arms", "These are my arms."],
  ["face", "This is my face."], ["ears", "These are my ears."],
] as const;

function practiceUnitData() {
  return courseUnits.map((unit) => {
    if (unit.id === 2) return { id: unit.id, title: unit.title, icon: unit.icon, words: unit.words, orderingSentences: null };
    if (unit.id === 1 || unit.id === 3) {
      const source = unit.id === 1 ? legacyUnit1Order : legacyUnit3Order;
      const orderingSentences = source.flatMap(([imageWord, en]) => {
        const sentence = unit.models.find((model) => model.en === en);
        // The original U1 game contains two sentences absent from T3's general model list.
        // Preserve those exact source strings here; this is a focused game data adapter.
        return [{ ...(sentence ?? { en }), imageWord }];
      });
      return { id: unit.id, title: unit.title, icon: unit.icon, words: unit.words, orderingSentences };
    }
    const originalModels = unit.modelSets.find((set) => set.source === `COURSE[${unit.id}].models`)?.sentences ?? [];
    const orderingSentences = originalModels.map((model) => ({
      ...model,
      en: model.en.replace(/[’‘]/g, "'").split(/(?<=[.!?])\s+/)[0],
    }));
    return { id: unit.id, title: unit.title, icon: unit.icon, words: unit.words, orderingSentences: orderingSentences.length ? orderingSentences : null };
  });
}

const practiceUnits = practiceUnitData();


export const metadata: Metadata = {
  title: "Kidotalks | یادگیری انگلیسی با بازی و گفت‌وگو",
  description:
    "درس‌های کوتاه، ویدیو و تمرین‌های سرگرم‌کننده برای یادگیری انگلیسی کودکان با Kidotalks.",
  applicationName: "Kidotalks",
  openGraph: {
    title: "Kidotalks | یادگیری انگلیسی با بازی و گفت‌وگو",
    description: "با خیال راحت یاد بگیر، با اعتمادبه‌نفس حرف بزن.",
    locale: "fa_IR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" data-theme="light">
      <head><link rel="stylesheet" href="/prototype.css" /></head>
    <body data-theme="home"><SiteShell units={courseUnits.map(({ id, title, icon }) => ({ id, title, icon }))} practiceUnits={practiceUnits} firstLessons={courseUnits.map(({ id, title, icon, sections, words, activities, grammar, modelSets, phonics, reading, writing, extra, sourcePages }) => ({ id, title, icon, sections, phonics, reading, writing, extra, firstPrintedPage: sourcePages.firstPrintedPage, words: words.filter(w => w.section === 1), moreWords: words.filter(w => w.section === 3), activityCount: activities.filter(a => a.key !== "cards").length, sentenceLesson: { tips: grammar.teachingTips, models: modelSets.find(set => set.source === (id === 1 ? "teacherModels()" : `COURSE[${id}].models`))?.sentences ?? [] } }))}>{children}</SiteShell></body>
    </html>
  );
}
