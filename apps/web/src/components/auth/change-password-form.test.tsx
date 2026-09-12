import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

describe("ChangePasswordForm", () => {
  it("renders the current values", () => {
    render(
      <ChangePasswordForm
        currentPassword="old"
        newPassword="new-password-1"
        onCurrentPasswordChange={vi.fn()}
        onNewPasswordChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Current password")).toHaveValue("old");
    expect(screen.getByLabelText("New password")).toHaveValue("new-password-1");
  });

  it("calls onSubmit on submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <ChangePasswordForm
        currentPassword="old"
        newPassword="new-password-1"
        onCurrentPasswordChange={vi.fn()}
        onNewPasswordChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Update password" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows an error message when given one", () => {
    render(
      <ChangePasswordForm
        currentPassword=""
        newPassword=""
        onCurrentPasswordChange={vi.fn()}
        onNewPasswordChange={vi.fn()}
        onSubmit={vi.fn()}
        errorMessage="Current password is incorrect."
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Current password is incorrect.");
  });
});
