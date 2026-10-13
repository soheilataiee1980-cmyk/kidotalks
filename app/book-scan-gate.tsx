import type { ReactNode } from "react";
import { BOOK_SCANS_ENABLED } from "../lib/features";
/** Wrap scan content inside its prototype section when T4b implements it. */
export default function BookScanGate({ children }: { children: ReactNode }) {
  return BOOK_SCANS_ENABLED ? children : <p className="sub">صفحات کتاب به‌زودی در دسترس قرار می‌گیرند.</p>;
}
