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
      <body data-theme="home"><SiteShell units={courseUnits.map(({ id, title, icon }) => ({ id, title, icon }))} firstLessons={courseUnits.map(({ id, title, icon, sections, words, activities, grammar, modelSets, phonics }) => ({ id, title, icon, sections, phonics, words: words.filter(w => w.section === 1), moreWords: words.filter(w => w.section === 3), activityCount: activities.filter(a => a.key !== "cards").length, sentenceLesson: { tips: grammar.teachingTips, models: modelSets.find(set => set.source === (id === 1 ? "teacherModels()" : `COURSE[${id}].models`))?.sentences ?? [] } }))}>{children}</SiteShell></body>
    </html>
  );
}
