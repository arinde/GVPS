import { controlProps, FormField } from "@/components/common/form-field";
import { NativeSelect } from "@/components/common/native-select";
import { TextInput } from "@/components/common/text-input";
import type { StaffFieldProps } from "@/components/staff/staff-field-props";

const NUMBER_HINT = "10 digits";
const NAME_HINT = "Exactly as it appears on the account";

export type StaffSalaryAccountFieldsProps = StaffFieldProps & { banks: string[] };

/**
 * Where salary is paid. Optional when the account is created, but the API
 * takes all three fields or none. The bank is chosen from a list and the
 * number is limited to digits, because a mistyped account sends someone's pay
 * to a stranger.
 */
export function StaffSalaryAccountFields({ value, onChange, errors, disabled, banks }: StaffSalaryAccountFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField id="bank-name" label="Bank" error={errors.bankName}>
        <NativeSelect
          {...controlProps("bank-name", errors.bankName)}
          placeholder="Select a bank…"
          options={banks.map((bank) => ({ value: bank, label: bank }))}
          value={value.bankName ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ bankName: event.target.value || undefined })}
        />
      </FormField>

      <FormField id="account-number" label="Account number" hint={NUMBER_HINT} error={errors.accountNumber}>
        <TextInput
          {...controlProps("account-number", errors.accountNumber, NUMBER_HINT)}
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          className="tabular font-mono"
          value={value.accountNumber ?? ""}
          disabled={disabled}
          // Digits only, so a pasted "0123 456 789" becomes "0123456789".
          onChange={(event) => onChange({ accountNumber: event.target.value.replace(/\D/g, "") || undefined })}
        />
      </FormField>

      <FormField
        id="account-name"
        label="Account name"
        hint={NAME_HINT}
        className="sm:col-span-2"
        error={errors.accountName}
      >
        <TextInput
          {...controlProps("account-name", errors.accountName, NAME_HINT)}
          autoComplete="off"
          value={value.accountName ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ accountName: event.target.value || undefined })}
        />
      </FormField>
    </div>
  );
}
