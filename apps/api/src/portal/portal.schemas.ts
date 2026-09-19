import { z } from "zod";
import { PhoneSchema } from "@/common/schemas/phone.schema";

export const ParentLoginSchema = z.object({
  phone: PhoneSchema,
  password: z.string().min(1, "Enter your password"),
});

/** The school office naming the phone number a portal login is for. */
export const ParentAccessSchema = z.object({ phone: PhoneSchema });

export type ParentLoginDto = z.infer<typeof ParentLoginSchema>;
export type ParentAccessDto = z.infer<typeof ParentAccessSchema>;
