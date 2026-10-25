import { PayrollRunView } from "@/components/payroll/payroll-run-view";

export default async function PayrollRunPage({ params }: PageProps<"/payroll/[runId]">) {
  const { runId } = await params;
  return <PayrollRunView runId={runId} />;
}
