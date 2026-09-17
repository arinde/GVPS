"use client";

import Link from "next/link";
import { Search, UserPlus } from "lucide-react";
import { DataTable } from "@/components/common/data-table";
import { studentColumns } from "@/components/students/student-columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListStudentsQuery } from "@/store/api/students-api";
import { useUiStore } from "@/stores/ui/use-ui-store";

const TABLE_ID = "students";

/**
 * The registry list. The search box is Zustand UI state (AGENTS.md §3) and the
 * rows come from RTK Query — server data is never copied into the store.
 */
export function StudentRegistryView() {
  const filter = useUiStore((state) => state.tableFilters[TABLE_ID] ?? "");
  const setTableFilter = useUiStore((state) => state.setTableFilter);

  const { data, isFetching } = useListStudentsQuery({ q: filter || undefined });
  const students = data?.students ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl">Students</h1>
          <p className="text-muted-foreground text-sm">
            {isFetching ? "Searching…" : `${students.length} shown${data?.nextCursor ? ", more available" : ""}`}
          </p>
        </div>
        <Button render={<Link href="/students/new" />}>
          <UserPlus aria-hidden="true" />
          Register student
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          type="search"
          aria-label="Search students"
          placeholder="Search by name or admission number…"
          className="pl-9"
          value={filter}
          onChange={(event) => setTableFilter(TABLE_ID, event.target.value)}
        />
      </div>

      <div className="bg-card rounded-lg border">
        <DataTable
          columns={studentColumns}
          data={students}
          isLoading={isFetching}
          emptyTitle={filter ? "No students match that search" : "No students registered yet"}
          emptyDescription={
            filter ? "Try a surname or an admission number." : "Register the first student to get started."
          }
        />
      </div>
    </div>
  );
}
