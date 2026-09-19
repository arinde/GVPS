"use client";

import { useState } from "react";
import { ContentCard } from "@/components/common/content-card";
import { AssignSubjectForm } from "@/components/staff/assign-subject-form";
import { AssignWholeClassForm } from "@/components/staff/assign-whole-class-form";
import { TeachingList } from "@/components/staff/teaching-list";
import { notify } from "@/lib/notify";
import { staffName } from "@/lib/staff-name";
import { useListClassArmsQuery } from "@/store/api/academic-api";
import {
  useAssignSubjectMutation,
  useAssignWholeClassMutation,
  useListSubjectClassesQuery,
  useListSubjectsQuery,
  useListTeachingAssignmentsQuery,
  useUnassignSubjectMutation,
  type TeachingAssignment,
} from "@/store/api/subjects-api";

export type SubjectTeachingCardProps = { staffId: string; name: string };

/**
 * What a teacher teaches this session (FEATURES.md §2.4), on their staff
 * profile. Two ways in: one subject across several classes (secondary), or
 * every subject in one class (a primary class teacher). Superadmin only.
 */
export function SubjectTeachingCard({ staffId, name }: SubjectTeachingCardProps) {
  const { data: assignments = [] } = useListTeachingAssignmentsQuery(staffId);
  const { data: subjects = [] } = useListSubjectsQuery();
  const { data: arms = [] } = useListClassArmsQuery();
  // Unsaved choices in the two forms (AGENTS.md §2: local form state).
  const [subjectId, setSubjectId] = useState("");
  const [classArmIds, setClassArmIds] = useState<string[]>([]);
  const [wholeClassId, setWholeClassId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: classOptions = [], isFetching } = useListSubjectClassesQuery(subjectId, { skip: !subjectId });
  const [assignSubject, assigning] = useAssignSubjectMutation();
  const [assignWholeClass, assigningClass] = useAssignWholeClassMutation();
  const [unassign, unassigning] = useUnassignSubjectMutation();

  const classes = classOptions.map((arm) => {
    const current = arm.subjectAssignments[0]?.staff;
    const hint = !current ? undefined : current.id === staffId ? "Already theirs" : `Now: ${staffName(current)}`;
    return { value: arm.id, label: `${arm.classLevel.name}${arm.name}`, hint };
  });

  async function assign() {
    try {
      const { assigned } = await assignSubject({ staffId, subjectId, classArmIds }).unwrap();
      const subject = subjects.find((candidate) => candidate.id === subjectId)?.name ?? "Subject";
      notify.success(`${subject} assigned to ${name}`, {
        description: `${assigned} class${assigned === 1 ? "" : "es"}`,
      });
      setSubjectId("");
      setClassArmIds([]);
      setErrors({});
    } catch (error) {
      setErrors(notify.error(error, "Could not assign the subject.").fieldErrors);
    }
  }

  async function assignClass() {
    try {
      const { assigned } = await assignWholeClass({ staffId, classArmId: wholeClassId }).unwrap();
      notify.success(`${name} now teaches all ${assigned} subjects in that class`);
      setWholeClassId("");
    } catch (error) {
      notify.error(error, "Could not assign the class's subjects.");
    }
  }

  async function remove(assignment: TeachingAssignment) {
    try {
      await unassign(assignment.id).unwrap();
      notify.success(
        `${assignment.subject.name} in ${assignment.classArm.classLevel.name}${assignment.classArm.name} removed`,
      );
    } catch (error) {
      notify.error(error, "Could not remove that class.");
    }
  }

  return (
    <ContentCard className="flex flex-col gap-6">
      <div>
        <h2 className="text-base">Subjects taught this session</h2>
        <p className="text-muted-foreground mb-3 text-xs">
          A teacher sees the students in every class they teach. Assigning a class that already has a teacher for the
          subject replaces them.
        </p>
        <TeachingList
          assignments={assignments}
          onRemove={remove}
          busyId={unassigning.isLoading ? unassigning.originalArgs : undefined}
        />
      </div>

      <div className="border-border border-t pt-5">
        <h3 className="mb-3 text-sm font-semibold">Assign a subject</h3>
        <AssignSubjectForm
          subjects={subjects.map((subject) => ({ value: subject.id, label: `${subject.name} (${subject.code})` }))}
          subjectId={subjectId}
          onSubjectChange={(id) => {
            setSubjectId(id);
            setClassArmIds([]);
            setErrors({});
          }}
          classes={classes}
          classArmIds={classArmIds}
          onToggleClass={(id, checked) =>
            setClassArmIds((current) => (checked ? [...current, id] : current.filter((value) => value !== id)))
          }
          onSubmit={assign}
          isLoadingClasses={isFetching}
          isSubmitting={assigning.isLoading}
          errors={errors}
        />
      </div>

      <div className="border-border border-t pt-5">
        <AssignWholeClassForm
          classes={arms.map((arm) => ({ value: arm.id, label: `${arm.classLevel.name}${arm.name}` }))}
          classArmId={wholeClassId}
          onChange={setWholeClassId}
          onSubmit={assignClass}
          isSubmitting={assigningClass.isLoading}
        />
      </div>
    </ContentCard>
  );
}
