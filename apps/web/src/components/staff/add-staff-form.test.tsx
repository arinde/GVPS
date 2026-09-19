import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AddStaffForm, type AddStaffFormProps } from "@/components/staff/add-staff-form";
import type { CreateStaffRequest } from "@/store/api/staff-api";

const EMPTY: CreateStaffRequest = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address: "",
  nextOfKinName: "",
  nextOfKinRelationship: "",
  nextOfKinPhone: "",
  roles: [],
};

function renderForm(overrides: Partial<AddStaffFormProps> = {}) {
  const props: AddStaffFormProps = {
    value: EMPTY,
    banks: ["Zenith Bank", "Wema Bank"],
    relationships: ["Spouse", "Parent"],
    onChange: vi.fn(),
    onRoleToggle: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };
  render(<AddStaffForm {...props} />);
  return props;
}

describe("AddStaffForm", () => {
  it("asks for the staff member's details, not just an email", () => {
    renderForm();

    expect(screen.getByLabelText(/^first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^surname/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/^phone/i)[0]).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^home address/i)).toBeInTheDocument();
  });

  it("asks for a next of kin", () => {
    renderForm();

    expect(screen.getByRole("heading", { name: "Next of kin" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Spouse" })).toBeInTheDocument();
  });

  it("offers banks from the list rather than a free-text field", () => {
    renderForm();

    expect(screen.getByLabelText(/^bank/i).tagName).toBe("SELECT");
    expect(screen.getByRole("option", { name: "Wema Bank" })).toBeInTheDocument();
  });

  it("says the salary account is optional and who can see it", () => {
    renderForm();

    expect(screen.getByText(/only the superadmin can see these details/i)).toBeInTheDocument();
  });

  it("keeps only digits in the account number, as pasted", async () => {
    const { onChange } = renderForm();

    await userEvent.type(screen.getByLabelText(/^account number/i), "0");
    await userEvent.type(screen.getByLabelText(/^account number/i), "x");

    expect(onChange).toHaveBeenCalledWith({ accountNumber: "0" });
    expect(onChange).toHaveBeenLastCalledWith({ accountNumber: undefined });
  });

  it("renders a checkbox per role, checked according to the draft", () => {
    renderForm({ value: { ...EMPTY, roles: ["FORM_TEACHER"] } });

    expect(screen.getByRole("checkbox", { name: "Form teacher" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Bursar" })).not.toBeChecked();
  });

  it("reports a role toggle", async () => {
    const { onRoleToggle } = renderForm();

    await userEvent.click(screen.getByRole("checkbox", { name: "Bursar" }));

    expect(onRoleToggle).toHaveBeenCalledWith("BURSAR", true);
  });

  it("reports edits through onChange", async () => {
    const { onChange } = renderForm();

    await userEvent.type(screen.getByLabelText(/^first name/i), "N");

    expect(onChange).toHaveBeenCalledWith({ firstName: "N" });
  });

  it("explains why the button is disabled when no role is chosen", () => {
    renderForm();

    expect(screen.getByRole("button", { name: /create staff account/i })).toBeDisabled();
    expect(screen.getByText(/choose at least one role/i)).toBeInTheDocument();
  });

  it("submits once a role is chosen", async () => {
    const { onSubmit } = renderForm({ value: { ...EMPTY, roles: ["BURSAR"] } });

    await userEvent.click(screen.getByRole("button", { name: /create staff account/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("marks a field invalid from the API's field errors", () => {
    renderForm({ fieldErrors: { phone: "Enter a valid Nigerian phone number" } });

    const phone = screen.getAllByLabelText(/^phone/i)[0];
    expect(phone).toHaveAttribute("aria-invalid", "true");
    expect(phone).toHaveAccessibleDescription("Enter a valid Nigerian phone number");
  });
});
