import { AdmissionNumberService, formatAdmissionNumber } from "@/students/admission-number.service";
import { Section, type School } from "@prisma/client";

const school = {
  id: "school-1",
  admissionNoFormat: "{PREFIX}/{YEAR}/{SEQ}",
  admissionNoPrefix: "GVPS",
  admissionNoPadding: 4,
  admissionCodePrimary: "PRY",
} as School;

describe("formatAdmissionNumber", () => {
  it("pads the sequence to the configured width", () => {
    expect(formatAdmissionNumber(school, 2026, 42)).toBe("GVPS/2026/0042");
  });

  it("does not truncate a sequence wider than the padding", () => {
    expect(formatAdmissionNumber(school, 2026, 123456)).toBe("GVPS/2026/123456");
  });

  it("honours a different format entirely", () => {
    const alternative = { ...school, admissionNoFormat: "{YEAR}-{SEQ}", admissionNoPadding: 3 } as School;
    expect(formatAdmissionNumber(alternative, 2027, 7)).toBe("2027-007");
  });

  it("supports a format that repeats a token", () => {
    const repeated = { ...school, admissionNoFormat: "{PREFIX}/{PREFIX}-{SEQ}" } as School;
    expect(formatAdmissionNumber(repeated, 2026, 1)).toBe("GVPS/GVPS-0001");
  });
});

describe("AdmissionNumberService", () => {
  let tx: { admissionCounter: { upsert: jest.Mock } };
  let service: AdmissionNumberService;

  beforeEach(() => {
    tx = { admissionCounter: { upsert: jest.fn() } };
    service = new AdmissionNumberService();
  });

  it("increments the counter for the admission year, not today's year", async () => {
    tx.admissionCounter.upsert.mockResolvedValue({ lastNumber: 1 });

    const number = await service.allocate(tx as never, school, Section.PRIMARY, 2024);

    expect(number).toBe("GVPS/2024/0001");
    expect(tx.admissionCounter.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { schoolId_code_year: { schoolId: "school-1", code: "PRY", year: 2024 } } }),
    );
  });

  it("uses an atomic increment rather than reading then writing", async () => {
    tx.admissionCounter.upsert.mockResolvedValue({ lastNumber: 8 });

    await service.allocate(tx as never, school, Section.PRIMARY, 2026);

    // The increment must be expressed as an operation, not a computed value,
    // or two concurrent registrations can read the same "last" number.
    expect(tx.admissionCounter.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { lastNumber: { increment: 1 } } }),
    );
  });

  it("allocates consecutive numbers as the counter advances", async () => {
    tx.admissionCounter.upsert.mockResolvedValueOnce({ lastNumber: 1 }).mockResolvedValueOnce({ lastNumber: 2 });

    const first = await service.allocate(tx as never, school, Section.PRIMARY, 2026);
    const second = await service.allocate(tx as never, school, Section.PRIMARY, 2026);

    expect([first, second]).toEqual(["GVPS/2026/0001", "GVPS/2026/0002"]);
  });
});
