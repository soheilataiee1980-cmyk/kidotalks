/** Original punctuation and text are preserved. Null means absent in the source. */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export interface BilingualText { en: string; fa: string }
export interface Word extends BilingualText {
  emoji: string | null;
  section: 1 | 3;
  /** Filename only, never a public URL or an import. */
  imageFile: string | null;
  /** Original inline artwork, when the prototype uses SVG instead of an emoji. */
  svg: string | null;
}
export interface Question {
  prompt: string | null;
  hint: string | null;
  answer: string;
  options: string[];
  /** Inert legacy presentation data. Never execute its inline event attributes. */
  sceneHtml: string | null;
  optionHtml?: string[];
  audio: string | null;
  answerAudio: string | null;
}
export interface Reading {
  text: string;
  questions: Question[];
  note: string | null;
}
export interface Extension {
  title: string;
  text: string;
  fa: string;
  project?: string;
  q?: [string, string, string, string][];
  review?: number[];
}
export interface CourseUnit {
  id: number;
  title: BilingualText;
  icon: string;
  words: Word[];
  grammar: { rules: string[]; teachingTips: string[]; questions: Question[] };
  /** Distinct en/fa pairs across ALL source model sets, including older variants. */
  models: BilingualText[];
  modelSets: { source: string; sentences: BilingualText[] }[];
  phonics: {
    mode: "alphabet" | "sounds";
    label: string | null;
    items: { sound: string; word: string; emoji: string | null; fa: string | null }[];
    alphabet: string | null;
  };
  reading: Reading;
  workbookReading: Reading | null;
  writing: { prompt: string; sample: string; mechanics: string; questions: Question[] };
  speaking: { prompts: string[] };
  extra: Extension | null;
  sections: { id: number; label: string }[];
  sourcePages: {
    firstPrintedPage: number;
    studentBook: (string | null)[];
    workbook: (string | null)[];
    note: string | null;
  };
  activities: { key: string; en: string; fa: string; icon: string }[];
  exerciseBanks: Record<string, Question[]>;
  videoTopics: { title: string; description: string; url: string }[];
  curatedVideos: [string, string, string][];
  /** Preservation of earlier lesson/writing/craft variants; not React pages. */
  lessonHtml: Record<string, string | null>;
  /** Exact original COURSE entry for provenance and future migration checks. */
  original: Record<string, JsonValue>;
}
export interface PrototypeText {
  /** Line and column in the original inline script (one-based). */
  line: number;
  column: number;
  kind: string;
  text: string;
}
export interface SharedContent {
  lessonNames: string[];
  phonicsGuide: string;
  originalWordArt: Record<string, [string, string]>;
  additionalArt: Record<string, string>;
  originalUnit1: Record<string, JsonValue>;
  originalBlanks: [string, string, string[]][];
  wordCounting: [string, number][];
  originalVideos: Record<string, { title: string; url: string; note: string }[]>;
  sourceText: PrototypeText[];
  sourceLiterals: { line: number; column: number; value: JsonValue }[];
}
