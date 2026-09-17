import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { Section, Stream } from "@prisma/client";
import { ClassStructureService } from "@/academic/class-structure.service";

describe("ClassStructureService", () => {
  let prisma: {
    classLevel: { findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock };
    classArm: { findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock };
  };
  let audit: { record: jest.Mock };
  let service: ClassStructureService;

  beforeEach(() => {
    prisma = {
      classLevel: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() },
      classArm: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    };
    audit = { record: jest.fn() };
    service = new ClassStructureService(prisma as never, audit as never);
  });

  describe("createLevel", () => {
    it("rejects a duplicate rank and names the clashing field", async () => {
      prisma.classLevel.findFirst.mockResolvedValue({ name: "Primary 2", rank: 1 });

      await expect(
        service.createLevel("staff-1", "school-1", { section: Section.PRIMARY, name: "Primary 1", rank: 1 }),
      ).rejects.toThrow(/rank 1/);
      expect(prisma.classLevel.create).not.toHaveBeenCalled();
    });

    it("rejects a duplicate name", async () => {
      prisma.classLevel.findFirst.mockResolvedValue({ name: "Primary 1", rank: 9 });

      await expect(
        service.createLevel("staff-1", "school-1", { section: Section.PRIMARY, name: "Primary 1", rank: 1 }),
      ).rejects.toThrow(ConflictException);
    });

    it("creates the level and writes an audit entry", async () => {
      prisma.classLevel.findFirst.mockResolvedValue(null);
      prisma.classLevel.create.mockResolvedValue({
        id: "level-1",
        name: "JSS 1",
        section: Section.JUNIOR,
        rank: 7,
      });

      const level = await service.createLevel("staff-1", "school-1", {
        section: Section.JUNIOR,
        name: "JSS 1",
        rank: 7,
      });

      expect(level.id).toBe("level-1");
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: "academic.level.created", entityId: "level-1" }),
      );
    });
  });

  describe("createArm", () => {
    it("rejects a stream on a primary arm", async () => {
      prisma.classLevel.findFirst.mockResolvedValue({
        id: "level-1",
        name: "Primary 4",
        section: Section.PRIMARY,
      });

      await expect(
        service.createArm("staff-1", "school-1", "level-1", { name: "A", stream: Stream.SCIENCE }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.classArm.create).not.toHaveBeenCalled();
    });

    it("rejects a stream on a junior arm", async () => {
      prisma.classLevel.findFirst.mockResolvedValue({ id: "level-2", name: "JSS 2", section: Section.JUNIOR });

      await expect(
        service.createArm("staff-1", "school-1", "level-2", { name: "B", stream: Stream.ARTS }),
      ).rejects.toThrow(BadRequestException);
    });

    it("allows a stream on a senior arm", async () => {
      prisma.classLevel.findFirst.mockResolvedValue({ id: "level-3", name: "SSS 1", section: Section.SENIOR });
      prisma.classArm.findUnique.mockResolvedValue(null);
      prisma.classArm.create.mockResolvedValue({ id: "arm-1", name: "A", stream: Stream.SCIENCE, capacity: 35 });

      const arm = await service.createArm("staff-1", "school-1", "level-3", {
        name: "A",
        stream: Stream.SCIENCE,
        capacity: 35,
      });

      expect(arm.id).toBe("arm-1");
      expect(prisma.classArm.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ stream: Stream.SCIENCE, classLevelId: "level-3" }),
        }),
      );
    });

    it("allows an arm with no stream at any section", async () => {
      prisma.classLevel.findFirst.mockResolvedValue({ id: "level-1", name: "Primary 4", section: Section.PRIMARY });
      prisma.classArm.findUnique.mockResolvedValue(null);
      prisma.classArm.create.mockResolvedValue({ id: "arm-2", name: "A" });

      await expect(service.createArm("staff-1", "school-1", "level-1", { name: "A" })).resolves.toMatchObject({
        id: "arm-2",
      });
    });

    it("rejects a duplicate arm name within the level", async () => {
      prisma.classLevel.findFirst.mockResolvedValue({ id: "level-1", name: "Primary 4", section: Section.PRIMARY });
      prisma.classArm.findUnique.mockResolvedValue({ id: "existing" });

      await expect(service.createArm("staff-1", "school-1", "level-1", { name: "A" })).rejects.toThrow(
        ConflictException,
      );
    });

    it("refuses a level belonging to another school", async () => {
      prisma.classLevel.findFirst.mockResolvedValue(null);

      await expect(service.createArm("staff-1", "school-1", "other-level", { name: "A" })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("listLevels", () => {
    it("orders by rank so promotion order is the display order", async () => {
      prisma.classLevel.findMany.mockResolvedValue([]);

      await service.listLevels("school-1");

      expect(prisma.classLevel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { schoolId: "school-1" }, orderBy: { rank: "asc" } }),
      );
    });
  });
});
