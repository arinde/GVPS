import { render, screen } from "@testing-library/react";
import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import { describe, expect, it } from "vitest";
import { DataTable } from "@/components/common/data-table";

type Student = { admissionNo: string; name: string; arm: string };

const helper = createColumnHelper<StockFeatures, Student>();

const columns = [
  helper.accessor("admissionNo", { header: "Admission no." }),
  helper.accessor("name", { header: "Name" }),
  helper.accessor("arm", { header: "Arm" }),
] as ColumnDef<StockFeatures, Student, unknown>[];

const students: Student[] = [
  { admissionNo: "SCH/2026/0001", name: "Adeyemi Tunde", arm: "Primary 3A" },
  { admissionNo: "SCH/2026/0002", name: "Okafor Chidinma", arm: "Primary 3A" },
];

describe("DataTable", () => {
  it("renders a header per column", () => {
    render(<DataTable columns={columns} data={students} />);

    expect(screen.getByRole("columnheader", { name: "Admission no." })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Arm" })).toBeInTheDocument();
  });

  it("renders a row per record", () => {
    render(<DataTable columns={columns} data={students} />);

    // One header row plus one row per student.
    expect(screen.getAllByRole("row")).toHaveLength(students.length + 1);
    expect(screen.getByText("Adeyemi Tunde")).toBeInTheDocument();
    expect(screen.getByText("SCH/2026/0002")).toBeInTheDocument();
  });

  it("shows the empty state when there are no rows", () => {
    render(<DataTable columns={columns} data={[]} emptyTitle="No students yet" />);

    expect(screen.getByText("No students yet")).toBeInTheDocument();
    expect(screen.queryByText("Adeyemi Tunde")).not.toBeInTheDocument();
  });

  it("shows a loading status instead of the empty state while loading", () => {
    render(<DataTable columns={columns} data={[]} isLoading emptyTitle="No students yet" />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("No students yet")).not.toBeInTheDocument();
  });
});
