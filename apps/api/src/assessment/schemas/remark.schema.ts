import { z } from "zod";
import { ALL_TRAITS } from "@/assessment/report-card";

const Comment = z.string().trim().max(300).nullable();

export const RemarkSchema = z
  .object({
    formComment: Comment.optional(),
    principalComment: Comment.optional(),
    traits: z
      .record(z.string(), z.number().int().min(1).max(5))
      .refine((traits) => Object.keys(traits).every((key) => ALL_TRAITS.includes(key)), {
        message: "Unknown trait.",
      })
      .nullable()
      .optional(),
  })
  .strict();

export type RemarkDto = z.infer<typeof RemarkSchema>;
