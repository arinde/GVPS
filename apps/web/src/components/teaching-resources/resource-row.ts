import type { TeachingResource } from "@/store/api/teaching-resources-api";

export type ResourceRow = TeachingResource & { subjectName: string; classLevelName: string; termName: string };

export const TYPE_LABELS: Record<TeachingResource["type"], string> = {
  SCHEME_OF_WORK: "Scheme of work",
  LECTURE_NOTE: "Lecture note",
  EXAM_QUESTIONS: "Exam questions",
};
