import Link from "next/link";
import { ContentCard } from "@/components/common/content-card";
import { DetailList } from "@/components/common/detail-list";
import { ageInYears, formatDate, formatMonthYear } from "@/lib/dates";
import type { StudentProfile } from "@/store/api/students-api";

const RELATIONSHIP = { FATHER: "Father", MOTHER: "Mother", GUARDIAN: "Guardian" } as const;

/**
 * The left column of the student profile (STITCH-SCREENS.md screen 5): photo
 * slot, the record's key facts, then guardians and siblings. Presentational.
 */
export function StudentRecordCard({ student }: { student: StudentProfile }) {
  return (
    <ContentCard className="flex flex-col gap-4">
      {/* Photographs are a second pass (FEATURES.md §3.5); this slot waits for one. */}
      <div className="border-input text-muted-foreground flex h-40 w-[120px] items-center justify-center self-center rounded-lg border text-center text-xs">
        Passport
        <br />
        photograph
      </div>

      <DetailList
        items={[
          { label: "Admission no.", value: student.admissionNo, mono: true },
          { label: "Date of birth", value: formatDate(student.dateOfBirth) },
          { label: "Age", value: `${ageInYears(student.dateOfBirth)} years` },
          { label: "Sex", value: student.sex === "FEMALE" ? "Female" : "Male" },
          {
            label: "Admitted",
            value: `${formatMonthYear(student.dateOfAdmission)} into ${student.admittedIntoLevel.name}`,
          },
          { label: "State of origin", value: student.stateOfOrigin },
          { label: "LGA", value: student.lga },
          { label: "Home address", value: student.address },
          { label: "Blood group", value: student.bloodGroup },
          { label: "Medical note", value: student.medicalNote },
          { label: "Previous school", value: student.previousSchool },
        ]}
      />

      <div className="flex flex-col gap-3">
        <h2 className="text-sm">Parents and guardians</h2>
        {student.guardians.map(({ guardian, relationship, isPrimary }) => (
          <div key={guardian.id} className="text-sm">
            <p className="text-foreground font-medium">
              {guardian.firstName} {guardian.lastName}
            </p>
            <p className="text-muted-foreground text-xs">
              {RELATIONSHIP[relationship]}
              {isPrimary ? " · primary contact" : ""}
              {guardian.occupation ? ` · ${guardian.occupation}` : ""}
            </p>
            <p className="text-muted-foreground tabular text-xs">
              {guardian.phone}
              {guardian.altPhone ? ` · ${guardian.altPhone}` : ""}
            </p>
          </div>
        ))}

        {student.siblings.length > 0 ? (
          <p className="text-muted-foreground text-xs">
            Also guardian to{" "}
            {student.siblings.map((sibling, index) => (
              <span key={sibling.id}>
                {index > 0 ? (index === student.siblings.length - 1 ? " and " : ", ") : ""}
                <Link href={`/students/${sibling.id}`} className="text-primary hover:underline">
                  {sibling.firstName}
                </Link>
                {sibling.className ? ` (${sibling.className})` : ""}
              </span>
            ))}
            .
          </p>
        ) : null}
      </div>
    </ContentCard>
  );
}
