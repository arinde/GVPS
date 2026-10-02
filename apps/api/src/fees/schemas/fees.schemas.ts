import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

export const CreateFeeItemSchema = z.object({
  name: z.string().trim().min(1).max(60),
});
export type CreateFeeItemDto = z.infer<typeof CreateFeeItemSchema>;

// FEATURES.md §6.1: amount per class level per term, and whether every
// student is billed it automatically or it's added on a case-by-case basis.
export const SetFeeStructureItemSchema = z.object({
  classLevelId: z.string().trim().min(1),
  feeItemId: z.string().trim().min(1),
  amountKobo: z.int().min(1),
  isCompulsory: z.boolean(),
});
export type SetFeeStructureItemDto = z.infer<typeof SetFeeStructureItemSchema>;

export const GenerateInvoicesSchema = z.object({
  classArmId: z.string().trim().min(1),
});
export type GenerateInvoicesDto = z.infer<typeof GenerateInvoicesSchema>;

export const AddInvoiceLineItemSchema = z.object({
  feeItemId: z.string().trim().min(1),
});
export type AddInvoiceLineItemDto = z.infer<typeof AddInvoiceLineItemSchema>;

export const RecordPaymentSchema = z.object({
  amountKobo: z.int().min(1),
  method: z.enum(PaymentMethod),
  reference: z.string().trim().max(60).optional(),
  payerName: z.string().trim().min(1, "Enter who paid.").max(100),
  receivedByName: z.string().trim().min(1, "Enter who received it.").max(100),
});
export type RecordPaymentDto = z.infer<typeof RecordPaymentSchema>;

export const ReversePaymentSchema = z.object({
  reason: z.string().trim().min(1).max(200),
});
export type ReversePaymentDto = z.infer<typeof ReversePaymentSchema>;
