import { CircleDashed, CircleCheck } from "lucide-react";
import type { OnboardingStep } from "@/store/api/staff-lifecycle-api";

export type OnboardingChecklistProps = { steps: OnboardingStep[]; complete: boolean };

/** Presentational: what a new teacher still needs. Every state has a word as well as an icon. */
export function OnboardingChecklist({ steps, complete }: OnboardingChecklistProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">{complete ? "Ready to teach" : "Still to do"}</p>
      <ul className="flex flex-col gap-2 text-sm">
        {steps.map((step) => {
          const Icon = step.done ? CircleCheck : CircleDashed;
          return (
            <li key={step.key} className="flex items-center gap-2">
              <Icon
                aria-hidden="true"
                className={step.done ? "text-success-foreground size-4" : "text-muted-foreground size-4"}
              />
              <span className={step.done ? "" : "text-muted-foreground"}>
                {step.label}
                {step.done ? "" : step.required ? " — needed" : " — not needed for this role"}
              </span>
              <span className="sr-only">{step.done ? "(done)" : "(not done)"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
