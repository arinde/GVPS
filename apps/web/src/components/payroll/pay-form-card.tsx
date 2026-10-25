import { ContentCard } from "@/components/common/content-card";
import { PayForm, type PayFormProps } from "@/components/payroll/pay-form";

export type PayFormCardProps = PayFormProps & {
  title: string;
  /** One line on what saving affects — and what it does not. */
  note: string;
};

/** PayForm in a card with a heading, as it opens above a table. Presentational. */
export function PayFormCard({ title, note, ...formProps }: PayFormCardProps) {
  return (
    <ContentCard>
      <h2 className="mb-1 text-base">{title}</h2>
      <p className="text-muted-foreground mb-5 text-xs">{note}</p>
      <PayForm {...formProps} />
    </ContentCard>
  );
}
