import { FormField, controlProps } from "@/components/common/form-field";
import { NativeSelect, type SelectOption } from "@/components/common/native-select";
import { TextInput } from "@/components/common/text-input";

export type ResourceMeta = { title: string; subjectId: string; classLevelId: string; termId: string };
export type ResourceMetaErrors = Partial<Record<keyof ResourceMeta, string>>;

export type ResourceMetaFieldsProps = {
  value: ResourceMeta;
  onChange: (value: ResourceMeta) => void;
  errors: ResourceMetaErrors;
  subjectOptions: SelectOption[];
  classLevelOptions: SelectOption[];
  termOptions: SelectOption[];
};

/** The four fields every teaching resource shares, factored out so the three type-specific forms don't repeat them (AGENTS.md §1). */
export function ResourceMetaFields({
  value,
  onChange,
  errors,
  subjectOptions,
  classLevelOptions,
  termOptions,
}: ResourceMetaFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField id="title" label="Title" required error={errors.title} className="sm:col-span-2">
        <TextInput
          {...controlProps("title", errors.title)}
          value={value.title}
          onChange={(event) => onChange({ ...value, title: event.target.value })}
          placeholder="e.g. JSS 2 Basic Science — First term"
        />
      </FormField>
      <FormField id="subjectId" label="Subject" required error={errors.subjectId}>
        <NativeSelect
          {...controlProps("subjectId", errors.subjectId)}
          options={subjectOptions}
          placeholder="Choose a subject"
          value={value.subjectId}
          onChange={(event) => onChange({ ...value, subjectId: event.target.value })}
        />
      </FormField>
      <FormField id="classLevelId" label="Class" required error={errors.classLevelId}>
        <NativeSelect
          {...controlProps("classLevelId", errors.classLevelId)}
          options={classLevelOptions}
          placeholder="Choose a class"
          value={value.classLevelId}
          onChange={(event) => onChange({ ...value, classLevelId: event.target.value })}
        />
      </FormField>
      <FormField id="termId" label="Term" required error={errors.termId} className="sm:col-span-2">
        <NativeSelect
          {...controlProps("termId", errors.termId)}
          options={termOptions}
          placeholder="Choose a term"
          value={value.termId}
          onChange={(event) => onChange({ ...value, termId: event.target.value })}
        />
      </FormField>
    </div>
  );
}
