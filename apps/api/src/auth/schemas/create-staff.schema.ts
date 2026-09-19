import { z } from "zod";
import { Role } from "@prisma/client";
import { blankAsUndefined } from "@/common/schemas/blank-as-undefined";
import { PhoneSchema } from "@/common/schemas/phone.schema";
import { NEXT_OF_KIN_RELATIONSHIPS, NIGERIAN_BANKS } from "@/reference/staff-reference";

const Name = z.string().trim().min(1).max(80);
const Optional = (max: number) => blankAsUndefined(z.string().trim().max(max));

// Superadmin-only (FEATURES.md §1.6, PLAN.md §4.12). Basic details are
// required so the office knows who an account belongs to, and next of kin so
// someone can be called in an emergency (FEATURES.md §9.1). At least one role
// is required: an account with no roles can sign in but reach nothing.
//
// The salary account is optional — it may not be known the day an account is
// made — but it is all-or-nothing: a bank with no account number, or a number
// with no name to check it against, is worse than none.
export const CreateStaffSchema = z
  .object({
    firstName: Name,
    lastName: Name,
    otherNames: Optional(80),
    phone: PhoneSchema,
    email: z.email(),
    address: z.string().trim().min(1, "Enter a home address").max(200),

    nextOfKinName: z.string().trim().min(1, "Enter the next of kin's name").max(120),
    nextOfKinRelationship: z.enum(NEXT_OF_KIN_RELATIONSHIPS, "Choose a relationship from the list"),
    nextOfKinPhone: PhoneSchema,

    bankName: blankAsUndefined(z.enum(NIGERIAN_BANKS, "Choose a bank from the list")),
    // NUBAN: every Nigerian bank account number is exactly 10 digits.
    accountNumber: blankAsUndefined(
      z
        .string()
        .trim()
        .regex(/^\d{10}$/, "An account number is exactly 10 digits"),
    ),
    accountName: Optional(120),

    roles: z.array(z.enum(Role)).min(1, "Choose at least one role"),
  })
  .superRefine((staff, context) => {
    const bankFields = [
      ["bankName", staff.bankName, "Choose the bank"],
      ["accountNumber", staff.accountNumber, "Enter the account number"],
      ["accountName", staff.accountName, "Enter the name on the account"],
    ] as const;
    if (bankFields.every(([, value]) => value === undefined)) return;
    for (const [field, value, message] of bankFields) {
      if (value === undefined) context.addIssue({ code: "custom", path: [field], message });
    }
  });

export type CreateStaffDto = z.infer<typeof CreateStaffSchema>;

// Editing replaces the whole record with the same rules as creating it, so a
// saved record is always one that could have been created.
export const UpdateStaffSchema = CreateStaffSchema;
export type UpdateStaffDto = CreateStaffDto;
