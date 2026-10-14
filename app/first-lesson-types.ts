import type { BilingualText, CourseUnit, Extension, Word } from "../data/types";

/** Only implemented lesson content crosses the server/client boundary. */
export interface FirstLessonUnit extends Pick<CourseUnit, "id" | "title" | "icon" | "sections"> {
  words: Word[];
  moreWords: Word[];
  phonics: CourseUnit["phonics"];
  reading: CourseUnit["reading"];
  writing: CourseUnit["writing"];
  extra: Extension | null;
  firstPrintedPage: number;
  activityCount: number;
  sentenceLesson: { tips: string[]; models: BilingualText[] };
}
