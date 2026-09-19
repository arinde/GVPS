import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  StudentRegistrationForm,
  type StudentRegistrationFormProps,
} from "@/components/students/student-registration-form";
import type { ClassArmOption } from "@/store/api/academic-api";
import type { GuardianInput, RegisterStudentRequest } from "@/store/api/students-api";

const arms: ClassArmOption[] = [
  {
    id: "p4a",
    name: "A",
    capacity: 35,
    stream: null,
    classLevel: { id: "p4", name: "Primary 4", section: "PRIMARY", rank: 4 },
  },
  {
    id: "ss1a",
    name: "A",
    capacity: null,
    stream: null,
    classLevel: { id: "ss1", name: "SSS 1", section: "SENIOR", rank: 10 },
  },
  {
    id: "ss2a",
    name: "A",
    capacity: null,
    stream: "ARTS",
    classLevel: { id: "ss2", name: "SSS 2", section: "SENIOR", rank: 11 },
  },
];

const states = [
  { state: "Kano", lgas: ["Fagge", "Ungogo"] },
  { state: "Lagos", lgas: ["Agege", "Ikeja"] },
];

const guardian: GuardianInput = {
  firstName: "Musa",
  lastName: "Ibrahim",
  phone: "08012345678",
  relationship: "FATHER",
  isPrimary: true,
};

const draft: RegisterStudentRequest = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  sex: "FEMALE",
  admissionYear: 2026,
  dateOfAdmission: "2026-09-01",
  classArmId: "",
  guardians: [guardian],
};

function renderForm(overrides: Partial<StudentRegistrationFormProps> = {}) {
  const props: StudentRegistrationFormProps = {
    value: draft,
    arms,
    states,
    bloodGroups: ["A+", "O-"],
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
    expect(screen.getByRole("option", { name: "SSS 1A" })).toBeInTheDocument();
  });

  it("reports edits through onChange without holding state itself", async () => {
    const { onChange } = renderForm();

    // The first "First name" is the student's; the guardian block has its own.
    await userEvent.type(screen.getAllByLabelText(/^first name/i)[0], "F");

    expect(onChange).toHaveBeenCalledWith({ firstName: "F" });
  });

  it("submits on the register button", async () => {
    const { onSubmit } = renderForm();

    await userEvent.click(screen.getByRole("button", { name: /register student/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  describe("department", () => {
    it("is hidden for a primary class", () => {
      renderForm({ value: { ...draft, classArmId: "p4a" } });

      expect(screen.queryByLabelText(/department/i)).not.toBeInTheDocument();
    });

    it("is offered for a senior class", () => {
      renderForm({ value: { ...draft, classArmId: "ss1a" } });

      expect(screen.getByRole("option", { name: "Science" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Commercial" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Arts" })).toBeInTheDocument();
    });

    it("is fixed when the class already has one", () => {
      renderForm({ value: { ...draft, classArmId: "ss2a" } });

      expect(screen.getByLabelText(/department/i)).toBeDisabled();
      expect(screen.getByText(/set by the class: arts/i)).toBeInTheDocument();
    });
  });

  describe("state and LGA", () => {
    it("keeps the LGA disabled until a state is chosen", () => {
      renderForm();

      expect(screen.getByLabelText(/^lga/i)).toBeDisabled();
    });

    it("offers only the chosen state's LGAs", () => {
      renderForm({ value: { ...draft, stateOfOrigin: "Kano" } });

      expect(screen.getByRole("option", { name: "Fagge" })).toBeInTheDocument();
      expect(screen.queryByRole("option", { name: "Ikeja" })).not.toBeInTheDocument();
    });

    it("clears the LGA when the state changes", async () => {
      const { onChange } = renderForm({ value: { ...draft, stateOfOrigin: "Kano", lga: "Fagge" } });

      await userEvent.selectOptions(screen.getByLabelText(/state of origin/i), "Lagos");

      expect(onChange).toHaveBeenCalledWith({ stateOfOrigin: "Lagos", lga: undefined });
    });
  });

  it("labels the address as the home address", () => {
    renderForm();

    expect(screen.getByLabelText(/home address/i)).toBeInTheDocument();
  });

  it("offers blood group as a list with 'Not known' first", () => {
    renderForm();

    const options = screen.getAllByRole("option").map((option) => option.textContent);
    expect(options).toEqual(expect.arrayContaining(["Not known", "A+", "O-"]));
  });

  describe("guardians", () => {
    it("does not allow removing the only guardian", () => {
      renderForm();

      expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
    });

    it("allows removing one of several", () => {
      renderForm({ value: { ...draft, guardians: [guardian, { ...guardian, isPrimary: false }] } });

      expect(screen.getAllByRole("button", { name: /remove/i })).toHaveLength(2);
    });

    it("puts a guardian's error beside that guardian's field", () => {
      renderForm({
        value: { ...draft, guardians: [guardian, { ...guardian, isPrimary: false }] },
        fieldErrors: { "guardians.1.phone": "Enter a valid Nigerian phone number" },
      });

      const phones = screen.getAllByLabelText(/^phone/i);
      expect(phones[0]).not.toHaveAttribute("aria-invalid");
      expect(phones[1]).toHaveAttribute("aria-invalid", "true");
      expect(phones[1]).toHaveAccessibleDescription("Enter a valid Nigerian phone number");
    });
  });

  it("marks a student field invalid from the API's field errors", () => {
    renderForm({ fieldErrors: { dateOfBirth: "Enter a valid date" } });

    expect(screen.getByLabelText(/date of birth/i)).toHaveAttribute("aria-invalid", "true");
  });

  it("has no photograph upload, which must not block entry", () => {
    renderForm();

    expect(screen.queryByLabelText(/photo/i)).not.toBeInTheDocument();
  });
});
