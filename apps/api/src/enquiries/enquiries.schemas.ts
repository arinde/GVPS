import { z } from "zod";
import { EnquiryStatus } from "@prisma/client";
import { blankAsUndefined } from "@/common/schemas/blank-as-undefined";
import { PhoneSchema } from "@/common/schemas/phone.schema";

/** What a visitor can ask about: the school's stages, or the tutorial centre. */
export const ENQUIRY_INTERESTS = [
  "Creche, Nursery or KG",
  "Primary",
  "Junior secondary (JSS)",
  "Senior secondary (SSS)",
  "WAEC / JAMB tutorial centre",
  "Something else",
] as const;

export const SubmitEnquirySchema = z.object({
  parentName: z.string().trim().min(2, "Enter your name").max(100),
  phone: PhoneSchema,
  email: blankAsUndefined(z.email("Enter a valid email address")),
  childName: blankAsUndefined(z.string().trim().max(100)),
  interest: z.enum(ENQUIRY_INTERESTS, "Choose what you are enquiring about"),
  message: blankAsUndefined(z.string().trim().max(1000, "Keep the message under 1,000 characters")),
  // A field real visitors never see or fill. Anything in it marks a bot.
  website: z.string().max(200).optional(),
});

export const UpdateEnquirySchema = z.object({
  status: z.enum(EnquiryStatus),
  officeNote: blankAsUndefined(z.string().trim().max(500)),
});

export type SubmitEnquiryDto = z.infer<typeof SubmitEnquirySchema>;
export type UpdateEnquiryDto = z.infer<typeof UpdateEnquirySchema>;
