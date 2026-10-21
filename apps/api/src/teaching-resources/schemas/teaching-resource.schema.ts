import { z } from "zod";

const schemeOfWorkWeekSchema = z.object({
  week: z.number().int().min(1),
  topic: z.string().trim().min(1, "Give this week a topic."),
  objectives: z.string().trim().default(""),
  activities: z.string().trim().default(""),
  resources: z.string().trim().default(""),
});

const lectureNoteContentSchema = z.object({
  objectives: z.string().trim().default(""),
  body: z.string().trim().min(1, "The lecture needs some content."),
  references: z.string().trim().default(""),
});

const examQuestionSchema = z.object({
  number: z.number().int().min(1),
  text: z.string().trim().min(1, "Every question needs its text."),
  type: z.enum(["OBJECTIVE", "THEORY"]),
  options: z.array(z.string().trim().min(1)).default([]),
  correctAnswer: z.string().trim().default(""),
  marks: z.number().int().min(0),
});

const examQuestionsContentSchema = z.object({
  instructions: z.string().trim().default(""),
  questions: z.array(examQuestionSchema).min(1, "Add at least one question."),
});

const baseFields = {
  title: z.string().trim().min(1, "Give this a title."),
  subjectId: z.string().trim().min(1, "Choose a subject."),
  classLevelId: z.string().trim().min(1, "Choose a class level."),
  termId: z.string().trim().min(1, "Choose a term."),
};

// A discriminated union so `content`'s shape is checked against the type it
// claims to be — a scheme of work can't be saved with an exam's question
// list, and vice versa.
export const SaveTeachingResourceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("SCHEME_OF_WORK"),
    ...baseFields,
    content: z.object({ weeks: z.array(schemeOfWorkWeekSchema).min(1, "Add at least one week.") }),
  }),
  z.object({
    type: z.literal("LECTURE_NOTE"),
    ...baseFields,
    content: lectureNoteContentSchema,
  }),
  z.object({
    type: z.literal("EXAM_QUESTIONS"),
    ...baseFields,
    content: examQuestionsContentSchema,
  }),
]);
export type SaveTeachingResourceDto = z.infer<typeof SaveTeachingResourceSchema>;

export const RejectTeachingResourceSchema = z.object({
  reason: z.string().trim().min(3, "Give a short reason."),
});
export type RejectTeachingResourceDto = z.infer<typeof RejectTeachingResourceSchema>;
