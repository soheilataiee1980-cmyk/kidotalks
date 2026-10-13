"use client";
import { createContext, useContext } from "react";
import type { CourseUnit } from "../data/types";
export type UnitSummary = Pick<CourseUnit, "id" | "title" | "icon">;
export type Tab = "home" | "books" | "book" | "units" | "lessons" | "practice" | "videos" | "progress" | "parents" | "profiles";
export interface LocalProgress { unit: number; completedDay: string | null; mistakesToReview: number; stars: Record<string, number> }
export const initialProgress: LocalProgress = { unit: 1, completedDay: null, mistakesToReview: 0, stars: {} };
export const progressKey = "kidotalks-progress-v1";
export function readProgress(): LocalProgress {
  try {
    const raw = JSON.parse(localStorage.getItem(progressKey) || "null");
    if (!raw || typeof raw !== "object") return { ...initialProgress, stars: {} };
    const stars: Record<string, number> = {};
    if (raw.stars && typeof raw.stars === "object") for (const [key, value] of Object.entries(raw.stars)) {
      if (/^(?:[1-9]|1[0-5])$/.test(key) && typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 5) stars[key] = value;
    }
    return {
      unit: Number.isInteger(raw.unit) && raw.unit >= 1 && raw.unit <= 15 ? raw.unit : 1,
      completedDay: typeof raw.completedDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.completedDay) ? raw.completedDay : null,
      mistakesToReview: Number.isInteger(raw.mistakesToReview) && raw.mistakesToReview >= 0 ? raw.mistakesToReview : 0,
      stars,
    };
  } catch { return { ...initialProgress, stars: {} }; }
}
export const LearningContext = createContext<{ today: string; progress: LocalProgress; units: UnitSummary[]; go: (tab: Tab, unit?: number) => void }>({ today: "", progress: initialProgress, units: [], go: () => {} });
export const useLearning = () => useContext(LearningContext);
