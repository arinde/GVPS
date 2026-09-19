import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/login-form";

describe("LoginForm", () => {
  it("renders the current values", () => {
    render(
      <LoginForm
        identifier="a@example.com"
        password="secret"
        onIdentifierChange={vi.fn()}
        onPasswordChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Email")).toHaveValue("a@example.com");
    expect(screen.getByLabelText("Password")).toHaveValue("secret");
  });

  it("reports keystrokes through the change callbacks", async () => {
    const user = userEvent.setup();
    const onEmailChange = vi.fn();
    render(
      <LoginForm
        identifier=""
        password=""
        onIdentifierChange={onEmailChange}
        onPasswordChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Email"), "x");
    expect(onEmailChange).toHaveBeenCalledWith("x");
  });

  it("calls onSubmit without a full page navigation", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <LoginForm
        identifier="a@example.com"
        password="secret"
        onIdentifierChange={vi.fn()}
        onPasswordChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows an error message when given one", () => {
    render(
      <LoginForm
        identifier=""
        password=""
        onIdentifierChange={vi.fn()}
        onPasswordChange={vi.fn()}
        onSubmit={vi.fn()}
        errorMessage="Invalid email or password."
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Invalid email or password.");
  });

  it("disables the submit button while submitting", () => {
    render(
      <LoginForm
        identifier=""
        password=""
        onIdentifierChange={vi.fn()}
        onPasswordChange={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting
      />,
    );

    expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled();
  });
});
