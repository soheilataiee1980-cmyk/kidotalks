import type { BilingualText, CourseUnit, Word } from "../data/types";

/** Only implemented lesson content crosses the server/client boundary. */
export interface FirstLessonUnit extends Pick<CourseUnit, "id" | "title" | "icon" | "sections"> {
  words: Word[];
  activityCount: number;
  sentenceLesson: { tips: string[]; models: BilingualText[] };
}
