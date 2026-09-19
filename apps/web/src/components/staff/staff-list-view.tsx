"use client";

import { LayoutGrid, UserPlus } from "lucide-react";
import { AppLinkButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { DataTable } from "@/components/common/data-table";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { staffColumns } from "@/components/staff/staff-columns";
import { useListStaffQuery } from "@/store/api/staff-api";

/** STITCH-SCREENS.md screen 12: every staff account. Superadmin only. */
export function StaffListView() {
  const { data: staff = [], isLoading } = useListStaffQuery();
  const pending = staff.filter((member) => member.mustChangePassword).length;

  return (
    <PageContainer>
      <PageHeader
        title="Staff accounts"
        subtitle={`${staff.length} account${staff.length === 1 ? "" : "s"}${
          pending ? ` · ${pending} yet to set a password` : ""
        }`}
        actions={
          <>
            <AppLinkButton href="/staff/classes" variant="secondary">
              <LayoutGrid aria-hidden="true" />
              Class allocation
            </AppLinkButton>
            <AppLinkButton href="/staff/new">
              <UserPlus aria-hidden="true" />
              Create staff account
            </AppLinkButton>
          </>
        }
      />

      <ContentCard flush>
        <DataTable
          columns={staffColumns}
          data={staff}
          isLoading={isLoading}
          emptyTitle="No staff accounts yet"
          emptyDescription="Create the first staff account to get started."
        />
      </ContentCard>

      <p className="text-muted-foreground mt-3 text-xs">
        Only the superadmin can create accounts, change roles, or allocate classes.
      </p>
    </PageContainer>
  );
}
