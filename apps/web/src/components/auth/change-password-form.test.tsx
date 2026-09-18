import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChangePasswordForm, type ChangePasswordFormProps } from "@/components/auth/change-password-form";

function renderForm(overrides: Partial<ChangePasswordFormProps> = {}) {
  const props: ChangePasswordFormProps = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    onCurrentPasswordChange: vi.fn(),
    onNewPasswordChange: vi.fn(),
    onConfirmPasswordChange: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };
  render(<ChangePasswordForm {...props} />);
  return props;
}

describe("ChangePasswordForm", () => {
  it("submits through onSubmit", async () => {
    const { onSubmit } = renderForm();

    await userEvent.click(screen.getByRole("button", { name: /update password/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("states the length rule before anything is typed", () => {
    renderForm();

    expect(screen.getByText("At least 10 characters")).toBeInTheDocument();
  });

  it("counts down while the new password is too short", () => {
    renderForm({ newPassword: "abcdefg" });

    expect(screen.getByText("3 more characters needed")).toBeInTheDocument();
  });

  it("confirms once the new password is long enough", () => {
    renderForm({ newPassword: "abcdefghij" });

    expect(screen.getByText("Long enough")).toBeInTheDocument();
  });

  it("shows a field error beside its field and marks the input invalid", () => {
    renderForm({ fieldErrors: { confirmPassword: "Doesn't match the new password" } });

    const input = screen.getByLabelText(/confirm new password/i);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Doesn't match the new password");
  });

  it("shows the summary message", () => {
    renderForm({ errorMessage: "Current password is incorrect." });

    expect(screen.getByText("Current password is incorrect.")).toBeInTheDocument();
  });

  it("offers a show/hide toggle on every password field", () => {
    renderForm();

    expect(screen.getAllByRole("button", { name: "Show password" })).toHaveLength(3);
  });

  it("disables the fields and button while saving", () => {
    renderForm({ isSubmitting: true });

    expect(screen.getByRole("button", { name: /updating/i })).toBeDisabled();
    expect(screen.getByLabelText(/current password/i)).toBeDisabled();
  });
});
