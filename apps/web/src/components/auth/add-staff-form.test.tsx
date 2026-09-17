import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AddStaffForm } from "@/components/auth/add-staff-form";

describe("AddStaffForm", () => {
  it("renders a checkbox per role, checked according to selectedRoles", () => {
    render(
      <AddStaffForm
        email=""
        selectedRoles={["FORM_TEACHER"]}
        onEmailChange={vi.fn()}
        onRoleToggle={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole("checkbox", { name: "Form teacher" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Bursar" })).not.toBeChecked();
  });

  it("reports a role toggle through onRoleToggle", async () => {
    const user = userEvent.setup();
    const onRoleToggle = vi.fn();
    render(
      <AddStaffForm
        email=""
        selectedRoles={[]}
        onEmailChange={vi.fn()}
        onRoleToggle={onRoleToggle}
        onSubmit={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "Bursar" }));
    expect(onRoleToggle).toHaveBeenCalledWith("BURSAR", true);
  });

  it("disables submit until at least one role is selected", () => {
    render(
      <AddStaffForm
        email="a@example.com"
        selectedRoles={[]}
        onEmailChange={vi.fn()}
        onRoleToggle={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Create staff account" })).toBeDisabled();
  });

  it("enables submit once a role is selected", () => {
    render(
      <AddStaffForm
        email="a@example.com"
        selectedRoles={["BURSAR"]}
        onEmailChange={vi.fn()}
        onRoleToggle={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Create staff account" })).toBeEnabled();
  });
});
