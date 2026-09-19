import { cn } from "cn";
import { FIELD_CLASSES } from "@/components/common/field-styles";
import { FormField, controlProps } from "@/components/common/form-field";
import { NativeSelect, type SelectOption } from "@/components/common/native-select";
import { TextInput } from "@/components/common/text-input";
import type { EnquiryRequest } from "@/store/api/enquiries-api";

export type EnquiryFieldsProps = {
  value: EnquiryRequest;
  onChange: (patch: Partial<EnquiryRequest>) => void;
  errors: Record<string, string>;
  interests: SelectOption[];
  disabled?: boolean;
};

const PHONE_HINT = "e.g. 0801 234 5678 — the office will call you back";
const MESSAGE_HINT = "Optional — anything the office should know";

/** The enquiry's fields. Presentational: the draft, the options and callbacks in. */
export function EnquiryFields({ value, onChange, errors, interests, disabled = false }: EnquiryFieldsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="enquiry-name" label="Your name" required error={errors.parentName}>
          <TextInput
            {...controlProps("enquiry-name", errors.parentName)}
            autoComplete="name"
            value={value.parentName}
            disabled={disabled}
            onChange={(event) => onChange({ parentName: event.target.value })}
          />
        </FormField>
        <FormField id="enquiry-phone" label="Phone number" required hint={PHONE_HINT} error={errors.phone}>
          <TextInput
            {...controlProps("enquiry-phone", errors.phone, PHONE_HINT)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={value.phone}
            disabled={disabled}
            onChange={(event) => onChange({ phone: event.target.value })}
          />
        </FormField>
        <FormField id="enquiry-email" label="Email" hint="Optional" error={errors.email}>
          <TextInput
            {...controlProps("enquiry-email", errors.email, "Optional")}
            type="email"
            autoComplete="email"
            value={value.email ?? ""}
            disabled={disabled}
            onChange={(event) => onChange({ email: event.target.value })}
          />
        </FormField>
        <FormField id="enquiry-child" label="Child's name" hint="Optional" error={errors.childName}>
          <TextInput
            {...controlProps("enquiry-child", errors.childName, "Optional")}
            value={value.childName ?? ""}
            disabled={disabled}
            onChange={(event) => onChange({ childName: event.target.value })}
          />
        </FormField>
      </div>

      <FormField id="enquiry-interest" label="Enquiring about" required error={errors.interest}>
        <NativeSelect
          {...controlProps("enquiry-interest", errors.interest)}
          placeholder="Choose one…"
          options={interests}
          value={value.interest}
          disabled={disabled}
          onChange={(event) => onChange({ interest: event.target.value })}
        />
      </FormField>

      <FormField id="enquiry-message" label="Message" hint={MESSAGE_HINT} error={errors.message}>
        <textarea
          {...controlProps("enquiry-message", errors.message, MESSAGE_HINT)}
          rows={4}
          maxLength={1000}
          value={value.message ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ message: event.target.value })}
          className={cn(FIELD_CLASSES, "h-auto w-full py-2")}
        />
      </FormField>
    </>
  );
}
