"use client";

import { Search, UserPlus } from "lucide-react";
import { AppLinkButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { DataTable } from "@/components/common/data-table";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { TextInput } from "@/components/common/text-input";
import { studentColumns } from "@/components/students/student-columns";
import { useGetMyAccessQuery } from "@/store/api/access-api";
import { useListStudentsQuery } from "@/store/api/students-api";
import { useUiStore } from "@/stores/ui/use-ui-store";

const TABLE_ID = "students";

/**
 * The registry list. The search box is Zustand UI state (AGENTS.md §3) and the
 * rows come from RTK Query — server data is never copied into the store. The
 * API already limits a teacher to their own classes; this view only says so,
 * so a short list does not look like missing data.
 */
export function StudentRegistryView() {
  const filter = useUiStore((state) => state.tableFilters[TABLE_ID] ?? "");
  const setTableFilter = useUiStore((state) => state.setTableFilter);

  const { data, isFetching } = useListStudentsQuery({ q: filter || undefined });
  const { data: access } = useGetMyAccessQuery();
  const students = data?.students ?? [];

  const count = isFetching ? "Searching…" : `${students.length} shown${data?.nextCursor ? ", more available" : ""}`;
  const scope =
    access?.scope === "arms"
      ? ` · your classes: ${
          access.allocatedArms.map((arm) => `${arm.classLevel.name}${arm.name}`).join(", ") || "none allocated yet"
        }`
      : "";

  return (
    <PageContainer>
      <PageHeader
        title="Students"
        subtitle={`${count}${scope}`}
        actions={
          access?.canRegister ? (
            <AppLinkButton href="/students/new">
              <UserPlus aria-hidden="true" />
              Register student
            </AppLinkButton>
          ) : null
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search
          className="text-placeholder pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <TextInput
          type="search"
          aria-label="Search students"
          placeholder="Search by name or admission number"
          className="pl-9"
          value={filter}
          onChange={(event) => setTableFilter(TABLE_ID, event.target.value)}
        />
      </div>

      <ContentCard flush>
        <DataTable
          columns={studentColumns}
          data={students}
          isLoading={isFetching}
          emptyTitle={filter ? "No students match that search" : "No students registered yet"}
          emptyDescription={filter ? "Try a surname or an admission number." : "Registered students will appear here."}
        />
      </ContentCard>
    </PageContainer>
  );
}
