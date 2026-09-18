import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PasswordInput } from "@/components/common/password-input";

describe("PasswordInput", () => {
  it("hides the password by default", () => {
    render(<PasswordInput aria-label="Password" defaultValue="secret-value" />);

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  });

  it("reveals and hides again from the toggle", async () => {
    render(<PasswordInput aria-label="Password" defaultValue="secret-value" />);

    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");

    await userEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  });

  it("tells assistive technology whether it is pressed", async () => {
    render(<PasswordInput aria-label="Password" />);
    const toggle = screen.getByRole("button", { name: "Show password" });

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true");
  });

  it("does not submit the surrounding form when toggled", async () => {
    let submitted = false;
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = true;
        }}
      >
        <PasswordInput aria-label="Password" />
      </form>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Show password" }));

    expect(submitted).toBe(false);
  });

  it("disables the toggle with the field", () => {
    render(<PasswordInput aria-label="Password" disabled />);

    expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
  });
});
