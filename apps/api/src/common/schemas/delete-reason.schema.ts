import { z } from "zod";

// Deletes are soft and always leave a reason in the audit log (FEATURES.md §0).
export const DeleteReasonSchema = z.object({
  reason: z.string().trim().min(3, "Give a short reason for deleting this record.").max(200),
});
export type DeleteReasonDto = z.infer<typeof DeleteReasonSchema>;
