import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

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
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
