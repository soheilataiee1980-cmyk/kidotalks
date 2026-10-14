import type { CourseUnit, Word } from "../data/types";

/** Only section-one content crosses the server/client boundary in T4b.1. */
export interface FirstLessonUnit extends Pick<CourseUnit, "id" | "title" | "icon" | "sections"> {
  words: Word[];
  activityCount: number;
}
