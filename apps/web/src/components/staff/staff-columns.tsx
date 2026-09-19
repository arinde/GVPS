import Link from "next/link";
import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import { primaryRoleLabel } from "@/components/auth/roles";
import { AppLinkButton } from "@/components/common/app-button";
import { StatusPill } from "@/components/common/status-pill";
import { staffName } from "@/lib/staff-name";
import type { StaffMember } from "@/store/api/staff-api";

const helper = createColumnHelper<StockFeatures, StaffMember>();

/**
 * STITCH-SCREENS.md screen 12, limited to what the app records. Its "Last
 * sign-in" and "Suspended" columns need data that does not exist yet; this
 * shows "Password not set" instead — the state the office can act on today.
 */
export const staffColumns = [
  helper.display({
    id: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link href={`/staff/${row.original.id}`} className="text-foreground font-medium hover:underline">
        {staffName(row.original)}
      </Link>
    ),
  }),
  helper.accessor("email", { header: "Email" }),
  helper.accessor((staff) => staff.phone ?? "—", { id: "phone", header: "Phone" }),
  helper.accessor((staff) => primaryRoleLabel(staff.roles.map(({ role }) => role)), {
    id: "role",
    header: "Role",
    cell: ({ row, getValue }) => {
      const extra = row.original.roles.length - 1;
      return `${getValue()}${extra > 0 ? ` +${extra}` : ""}`;
    },
  }),
  helper.accessor(
    (staff) =>
      staff.classAssignments.map(({ classArm }) => `${classArm.classLevel.name}${classArm.name}`).join(", ") || "—",
    { id: "classes", header: "Classes" },
  ),
  helper.display({
    id: "status",
    header: "Status",
    cell: ({ row }) =>
      row.original.mustChangePassword ? (
        <StatusPill tone="warning" shape="diamond">
          Password not set
        </StatusPill>
      ) : (
        <StatusPill tone="success" shape="circle">
          Active
        </StatusPill>
      ),
  }),
  // The list is superadmin-only, and only the superadmin edits staff records.
  helper.display({
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <AppLinkButton
        href={`/staff/${row.original.id}/edit`}
        variant="secondary"
        size="small"
        aria-label={`Edit ${staffName(row.original)}`}
      >
        <Pencil aria-hidden="true" />
        Edit
      </AppLinkButton>
    ),
  }),
] as ColumnDef<StockFeatures, StaffMember, unknown>[];
