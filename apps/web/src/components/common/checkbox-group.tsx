import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "cn";

export type CheckboxOption = {
  value: string;
  label: string;
  /** A quieter line after the label, e.g. "currently Okafor, Ngozi". */
  hint?: string;
};

export type CheckboxGroupProps = {
  /** Unique on the page; prefixes each checkbox id. */
  id: string;
  legend: string;
  options: readonly CheckboxOption[];
  selected: string[];
  onToggle: (value: string, checked: boolean) => void;
  error?: string;
  disabled?: boolean;
  /** Lay the options out in columns on wider screens. */
  columns?: 1 | 2 | 3;
  className?: string;
};

const COLUMNS = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3" } as const;

/** A labelled set of checkboxes: roles, class levels, classes. Presentational. */
export function CheckboxGroup({
  id,
  legend,
  options,
  selected,
  onToggle,
  error,
  disabled = false,
  columns = 1,
  className,
}: CheckboxGroupProps) {
  const errorId = `${id}-error`;
  return (
    <fieldset className={cn("flex flex-col gap-2", className)} aria-describedby={error ? errorId : undefined}>
      <legend className="text-foreground mb-1 text-[13px] font-semibold">{legend}</legend>
      <div className={cn("grid gap-2", COLUMNS[columns])}>
        {options.map((option) => (
          <Label key={option.value} htmlFor={`${id}-${option.value}`} className="items-start font-normal">
            <Checkbox
              id={`${id}-${option.value}`}
              checked={selected.includes(option.value)}
              disabled={disabled}
              onCheckedChange={(checked) => onToggle(option.value, checked)}
            />
            <span>
              {option.label}
              {option.hint ? <span className="text-muted-foreground block text-xs">{option.hint}</span> : null}
            </span>
          </Label>
        ))}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
