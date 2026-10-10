"use client";

import { useState } from "react";
import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { EmptyState } from "@/components/common/empty-state";
import { NativeSelect } from "@/components/common/native-select";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/spinner";
import { decodeAccessToken } from "@/lib/decode-access-token";
import { downloadBroadsheetCsv, printBroadsheet } from "@/lib/broadsheet-export";
import { useGetCurrentPeriodQuery, useListClassArmsQuery } from "@/store/api/academic-api";
import { useGetMyAccessQuery } from "@/store/api/access-api";
import { useGetBroadsheetQuery } from "@/store/api/broadsheet-api";
import { useAppSelector } from "@/store/hooks";
import { selectAccessToken } from "@/store/slices/auth-slice";

// Mirrors the backend's own WHOLE_SCHOOL list for report cards/broadsheet (results/broadsheet.service.ts).
const WHOLE_SCHOOL_ROLES = ["SUPERADMIN", "PRINCIPAL", "ADMIN_SECRETARY"];

/**
 * FEATURES.md §5.9 — the whole arm's score matrix, read-only. Whole-school
 * roles see every class; a form teacher sees only their own arm (same
 * access rule as report cards, since it's the same underlying data).
 */
export function BroadsheetView() {
  const accessToken = useAppSelector(selectAccessToken);
  const isWholeSchool =
    decodeAccessToken(accessToken ?? "")?.roles.some((role) => WHOLE_SCHOOL_ROLES.includes(role)) ?? false;

  const { data: period } = useGetCurrentPeriodQuery();
  const { data: access } = useGetMyAccessQuery(undefined, { skip: isWholeSchool });
  const { data: allArms = [] } = useListClassArmsQuery(undefined, { skip: !isWholeSchool });
  const arms = isWholeSchool ? allArms : (access?.allocatedArms ?? []);

  const [classArmId, setClassArmId] = useState("");
  const termId = period?.term?.id;
  const ready = Boolean(termId && classArmId);
  const { data: sheet, isLoading } = useGetBroadsheetQuery({ termId: termId ?? "", classArmId }, { skip: !ready });

  return (
    <PageContainer>
      <PageHeader
        title="Broadsheet"
        subtitle={period?.term?.name}
        actions={
          sheet ? (
            <div className="flex flex-wrap gap-2">
              <AppButton type="button" variant="secondary" onClick={() => printBroadsheet(sheet)}>
                Print / Save as PDF
              </AppButton>
              <AppButton type="button" variant="secondary" onClick={() => downloadBroadsheetCsv(sheet)}>
                Download CSV
              </AppButton>
            </div>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-5">
        <ContentCard>
          <label className="mb-2 block text-sm font-medium" htmlFor="broadsheet-class">
            Class
          </label>
          <NativeSelect
            id="broadsheet-class"
            placeholder="Choose a class…"
            value={classArmId}
            onChange={(event) => setClassArmId(event.target.value)}
            options={arms.map((arm) => ({ value: arm.id, label: `${arm.classLevel.name}${arm.name}` }))}
            className="max-w-xs"
          />
        </ContentCard>

        {!ready ? (
          <ContentCard>
            <EmptyState title="Choose a class" description="Pick a class to see its broadsheet." />
          </ContentCard>
        ) : isLoading || !sheet ? (
          <LoadingState />
        ) : sheet.subjects.length === 0 ? (
          <ContentCard>
            <EmptyState
              title="No subjects published yet"
              description="The broadsheet fills in as each subject's results are published this term."
            />
          </ContentCard>
        ) : (
          <ContentCard flush>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground border-b text-left text-xs">
                  <tr>
                    <th className="px-3 py-2 font-medium">Pos.</th>
                    <th className="px-3 py-2 font-medium">Student</th>
                    {sheet.subjects.map((subject) => (
                      <th key={subject.subjectId} className="px-3 py-2 text-center font-medium">
                        {subject.subjectName}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-center font-medium">Total</th>
                    <th className="px-3 py-2 text-center font-medium">Average</th>
                  </tr>
                </thead>
                <tbody>
                  {sheet.rows.map((row) => (
                    <tr key={row.studentId} className="border-b last:border-0">
                      <td className="px-3 py-2">{row.position}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {row.name}
                        <span className="text-muted-foreground block text-xs">{row.admissionNo}</span>
                      </td>
                      {row.scores.map((cell, index) => (
                        <td key={sheet.subjects[index].subjectId} className="px-3 py-2 text-center">
                          {cell ? (
                            <>
                              {cell.total}
                              {cell.grade ? (
                                <span className="text-muted-foreground"> ({cell.grade.letter})</span>
                              ) : null}
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center font-medium">{row.total}</td>
                      <td className="px-3 py-2 text-center">{row.average}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ContentCard>
        )}
      </div>
    </PageContainer>
  );
}
