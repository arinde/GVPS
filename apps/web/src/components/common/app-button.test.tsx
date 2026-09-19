import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppButton, AppLinkButton } from "@/components/common/app-button";

describe("AppButton", () => {
  it("renders a native button", () => {
    render(<AppButton>Save record</AppButton>);

    expect(screen.getByRole("button", { name: "Save record" }).tagName).toBe("BUTTON");
  });
});

describe("AppLinkButton", () => {
  it("is announced as a link, not a button", () => {
    render(<AppLinkButton href="/students">Open registry</AppLinkButton>);

    expect(screen.getByRole("link", { name: "Open registry" })).toHaveAttribute("href", "/students");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
