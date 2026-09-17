import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StudentRegistrationForm } from "@/components/students/student-registration-form";
import type { ClassArmOption } from "@/store/api/academic-api";
import type { RegisterStudentRequest } from "@/store/api/students-api";

const arms: ClassArmOption[] = [
  {
    id: "arm-1",
    name: "A",
    capacity: 35,
    stream: null,
    classLevel: { id: "level-1", name: "Primary 4", section: "PRIMARY", rank: 4 },
  },
  {
    id: "arm-2",
    name: "B",
    capacity: null,
    stream: null,
    classLevel: { id: "level-2", name: "JSS 1", section: "JUNIOR", rank: 7 },
  },
];

const draft: RegisterStudentRequest = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  sex: "FEMALE",
  dateOfAdmission: "2026-09-01",
  classArmId: "",
  guardians: [],
};

function renderForm(overrides: Partial<React.ComponentProps<typeof StudentRegistrationForm>> = {}) {
  const props = {
    value: draft,
    arms,
    onChange: vi.fn(),
    onGuardianChange: vi.fn(),
    onAddGuardian: vi.fn(),
    onRemoveGuardian: vi.fn(),
    onMakeGuardianPrimary: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };
  render(<StudentRegistrationForm {...props} />);
  return props;
}

describe("StudentRegistrationForm", () => {
  it("lists every class arm as level plus arm name", () => {
    renderForm();

    expect(screen.getByRole("option", { name: "Primary 4A" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "JSS 1B" })).toBeInTheDocument();
  });

  it("reports edits through onChange without holding state itself", async () => {
    const { onChange } = renderForm();

    await userEvent.type(screen.getByLabelText(/first name/i), "F");

    expect(onChange).toHaveBeenCalledWith({ firstName: "F" });
  });

  it("submits on the register button", async () => {
    const { onSubmit } = renderForm();

    await userEvent.click(screen.getByRole("button", { name: /register student/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("says a student can be registered before a guardian is known", () => {
    renderForm();

    expect(screen.getByText(/registered now and their guardian added later/i)).toBeInTheDocument();
  });

  it("renders a fieldset per guardian", () => {
    renderForm({
      value: {
        ...draft,
        guardians: [
          { firstName: "Musa", lastName: "Ibrahim", phone: "08012345678", relationship: "FATHER", isPrimary: true },
          { firstName: "Aisha", lastName: "Ibrahim", phone: "08087654321", relationship: "MOTHER", isPrimary: false },
        ],
      },
    });

    expect(screen.getByRole("group", { name: /guardian 1/i })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /guardian 2/i })).toBeInTheDocument();
  });

  it("offers only one primary contact because the API rejects two", () => {
    renderForm({
      value: {
        ...draft,
        guardians: [
          { firstName: "Musa", lastName: "Ibrahim", phone: "08012345678", relationship: "FATHER", isPrimary: true },
          { firstName: "Aisha", lastName: "Ibrahim", phone: "08087654321", relationship: "MOTHER", isPrimary: false },
        ],
      },
    });

    const radios = screen.getAllByRole("radio", { name: /primary contact/i });
    expect(radios).toHaveLength(2);
    expect(radios.filter((radio) => (radio as HTMLInputElement).checked)).toHaveLength(1);
  });

  it("shows the server's message when registration fails", () => {
    renderForm({ errorMessage: "Ibrahim, Fatima with that date of birth is already registered as GVPS/2026/0001." });

    expect(screen.getByRole("alert")).toHaveTextContent("already registered as GVPS/2026/0001");
  });

  it("disables the submit button while saving", () => {
    renderForm({ isSubmitting: true });

    expect(screen.getByRole("button", { name: /registering/i })).toBeDisabled();
  });

  it("has no photograph upload, which must not block entry", () => {
    renderForm();

    expect(screen.queryByLabelText(/photo/i)).not.toBeInTheDocument();
  });
});
