import { ContentCard } from "@/components/common/content-card";
import { formatKobo } from "@/lib/money";
import type { ReportCard } from "@/store/api/report-card-api";
import { formatDate } from "@/lib/dates";

export type ReportCardViewProps = { card: ReportCard; schoolName: string; traitLabels: Record<string, string> };

/**
 * FEATURES.md §5.8 — the report card, as it was published. Presentational:
 * the staff page and the parent portal pass the same frozen card in. Printing
 * is handled by the page (see the print rule in globals.css), not here.
 */
export function ReportCardView({ card, schoolName, traitLabels }: ReportCardViewProps) {
  const traitEntries = card.remarks.traits ? Object.entries(card.remarks.traits) : [];

  return (
    <div id="report-card" className="flex flex-col gap-4">
      <ContentCard>
        <div className="flex flex-col gap-1 text-center">
          <h2 className="text-lg font-semibold">{schoolName}</h2>
          <p className="text-muted-foreground text-sm">
            Student report — {card.term.name}, class {card.classLabel}
          </p>
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground text-xs">Student</dt>
            <dd className="font-semibold">{card.student.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Admission no.</dt>
            <dd className="font-semibold">{card.student.admissionNo}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">School opened</dt>
            <dd className="font-semibold">{card.term.timesSchoolOpened ?? "—"} times</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Position in class</dt>
            <dd className="font-semibold">
              {card.totals.position} of {card.totals.classSize}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Average this term</dt>
            <dd className="font-semibold">{card.totals.average.toFixed(1)}%</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Cumulative average</dt>
            <dd className="font-semibold">
              {card.cumulative.average.toFixed(1)}% over {card.cumulative.termsCounted} term
              {card.cumulative.termsCounted === 1 ? "" : "s"}
            </dd>
          </div>
        </dl>
      </ContentCard>

      <ContentCard flush>
        <table className="w-full text-sm">
          <thead className="text-muted-foreground border-b text-left text-xs">
            <tr>
              <th className="px-4 py-2 font-medium">Subject</th>
              <th className="px-2 py-2 font-medium">Score</th>
              <th className="px-2 py-2 font-medium">Grade</th>
              <th className="px-2 py-2 font-medium">Position</th>
              <th className="px-2 py-2 font-medium">Class avg</th>
              <th className="px-2 py-2 font-medium">High / low</th>
            </tr>
          </thead>
          <tbody>
            {card.subjects.map((subject) => (
              <tr key={subject.subjectName} className="border-b last:border-0">
                <td className="px-4 py-2">{subject.subjectName}</td>
                <td className="px-2 py-2">
                  {subject.total}
                  <span className="text-muted-foreground">/{subject.maxTotal}</span>
                </td>
                <td className="px-2 py-2">
                  {subject.grade ? `${subject.grade.letter} — ${subject.grade.descriptor}` : "—"}
                </td>
                <td className="px-2 py-2">
                  {subject.position} of {subject.classSize}
                </td>
                <td className="px-2 py-2">{subject.classAverage.toFixed(1)}</td>
                <td className="px-2 py-2">
                  {subject.highest} / {subject.lowest}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ContentCard>

      {traitEntries.length > 0 ? (
        <ContentCard>
          <h3 className="mb-3 text-base">Traits</h3>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {traitEntries.map(([trait, rating]) => (
              <li key={trait} className="flex justify-between">
                <span>{traitLabels[trait] ?? trait}</span>
                <span className="font-semibold">{rating} of 5</span>
              </li>
            ))}
          </ul>
        </ContentCard>
      ) : null}

      <ContentCard>
        <div className="grid gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Form teacher&apos;s comment</p>
            <p>{card.remarks.formComment ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Principal&apos;s comment</p>
            <p>{card.remarks.principalComment ?? "—"}</p>
          </div>
          {card.promotion ? (
            <p>
              {card.promotion.recommended
                ? "Recommended for promotion to the next class."
                : `Not yet recommended for promotion. The cumulative average must reach ${card.promotion.threshold}%.`}
            </p>
          ) : null}
          <p>
            Outstanding fees:{" "}
            <span className="font-semibold">{card.feeBalanceKobo > 0 ? formatKobo(card.feeBalanceKobo) : "none"}</span>
          </p>
          <p className="text-muted-foreground text-xs">Published {formatDate(card.publishedAt)}</p>
        </div>
      </ContentCard>
    </div>
  );
}
