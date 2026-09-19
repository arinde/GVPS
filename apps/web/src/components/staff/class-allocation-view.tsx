"use client";

import { UserPlus } from "lucide-react";
import { AppLinkButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { DataTable } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { classAllocationColumns, type FormTeacherOption } from "@/components/staff/class-allocation-columns";
import { notify } from "@/lib/notify";
import { staffName } from "@/lib/staff-name";
import {
  useGetClassAllocationQuery,
  useListStaffQuery,
  useSetClassTeacherMutation,
  type StaffMember,
} from "@/store/api/staff-api";

function formTeachers(staff: StaffMember[]): FormTeacherOption[] {
  return staff
    .filter((member) => member.roles.some(({ role }) => role === "FORM_TEACHER"))
    .map((member) => ({ value: member.id, label: staffName(member), load: member.classAssignments.length }));
}

/**
 * The superadmin gives each class its form teacher for the current session.
 * A teacher sees and registers students only in the classes allocated here,
 * so an unallocated class is one only the office can register into.
 */
export function ClassAllocationView() {
  const allocation = useGetClassAllocationQuery();
  const { data: staff = [], isLoading: staffLoading } = useListStaffQuery();
  const [setClassTeacher, saving] = useSetClassTeacherMutation();

  const teachers = formTeachers(staff);
  const classes = allocation.data?.classes ?? [];
  const maxClasses = allocation.data?.maxClassesPerTeacher ?? 2;
  const unallocated = classes.filter((row) => !row.teacher).length;

  async function assign(classArmId: string, staffId: string | null) {
    const row = classes.find((candidate) => candidate.id === classArmId);
    const className = row ? `${row.classLevel.name}${row.name}` : "the class";
    try {
      await setClassTeacher({ classArmId, staffId }).unwrap();
      const teacher = teachers.find((candidate) => candidate.value === staffId);
      notify.success(teacher ? `${teacher.label} now has ${className}` : `${className} no longer has a form teacher`);
    } catch (error) {
      notify.error(error, `Could not change the form teacher for ${className}.`);
    }
  }

  const columns = classAllocationColumns({
    teachers,
    maxClassesPerTeacher: maxClasses,
    savingClassId: saving.isLoading ? saving.originalArgs?.classArmId : undefined,
    onAssign: assign,
  });

  return (
    <PageContainer>
      <PageHeader
        title="Class allocation"
        subtitle={
          allocation.data
            ? `${allocation.data.session.name} session · ${unallocated} of ${classes.length} classes without a teacher`
            : undefined
        }
      />

      {!staffLoading && teachers.length === 0 ? (
        <ContentCard>
          <EmptyState
            icon={UserPlus}
            title="No form teachers yet"
            description="Create a staff account with the Form teacher role, then come back to give them a class."
            action={<AppLinkButton href="/staff/new">Create staff account</AppLinkButton>}
          />
        </ContentCard>
      ) : (
        <ContentCard flush>
          <DataTable
            columns={columns}
            data={classes}
            isLoading={allocation.isLoading || staffLoading}
            emptyTitle="No classes set up"
            emptyDescription="Classes come from the academic structure for the current session."
          />
        </ContentCard>
      )}

      <p className="text-muted-foreground mt-3 text-xs">
        A form teacher can hold at most {maxClasses} classes; anyone already at the limit is left out of the other
        lists. Teachers see and register students only in their own classes.
      </p>
    </PageContainer>
  );
}
