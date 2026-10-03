import { z } from "zod";
import { Section } from "@prisma/client";

// FEATURES.md §5.1: components per section, each named with a max score, and
// the set must add up to exactly 100.
const ComponentInput = z.object({
  name: z.string().trim().min(1).max(40),
  maxScore: z.int().min(1).max(100),
});

export const SetAssessmentComponentsSchema = z
  .object({
    section: z.enum(Section),
    components: z.array(ComponentInput).min(1),
  })
  .refine((input) => input.components.reduce((sum, component) => sum + component.maxScore, 0) === 100, {
    message: "Components must add up to exactly 100 marks",
    path: ["components"],
  });

export type SetAssessmentComponentsDto = z.infer<typeof SetAssessmentComponentsSchema>;

const GradeBandInput = z.object({
  minScore: z.int().min(0).max(100),
  maxScore: z.int().min(0).max(100),
  letter: z.string().trim().min(1).max(10),
  descriptor: z.string().trim().min(1).max(40),
  remark: z.string().trim().min(1).max(100),
});

// FEATURES.md §5.2: boundaries per section, plus a pass mark and a separate
// promotion threshold. Bands must cover 0-100 with no gap and no overlap —
// a score landing in no band at all would break grade computation later.
export const SetGradingScaleSchema = z
  .object({
    section: z.enum(Section),
    passMark: z.int().min(0).max(100),
    promotionThreshold: z.int().min(0).max(100),
    bands: z.array(GradeBandInput).min(1),
  })
  .superRefine((input, context) => {
    const bands = [...input.bands].sort((a, b) => a.minScore - b.minScore);

    for (const band of bands) {
      if (band.minScore > band.maxScore) {
        context.addIssue({ code: "custom", path: ["bands"], message: `${band.letter}: min cannot exceed max` });
        return;
      }
    }

    if (bands[0].minScore !== 0) {
      context.addIssue({ code: "custom", path: ["bands"], message: "Bands must start at 0" });
      return;
    }
    if (bands[bands.length - 1].maxScore !== 100) {
      context.addIssue({ code: "custom", path: ["bands"], message: "Bands must end at 100" });
      return;
    }
    for (let i = 1; i < bands.length; i++) {
      if (bands[i].minScore !== bands[i - 1].maxScore + 1) {
        context.addIssue({
          code: "custom",
          path: ["bands"],
          message: `Bands must run with no gap or overlap: ${bands[i - 1].letter} ends at ${bands[i - 1].maxScore}, ${bands[i].letter} starts at ${bands[i].minScore}`,
        });
        return;
      }
    }
  });

export type SetGradingScaleDto = z.infer<typeof SetGradingScaleSchema>;
