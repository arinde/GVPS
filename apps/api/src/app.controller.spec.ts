import { Test, type TestingModule } from "@nestjs/testing";
import { AppController } from "@/app.controller";
import { AppService } from "@/app.service";

describe("AppController", () => {
  let controller: AppController;
  let service: { getHealth: jest.Mock };

  beforeEach(async () => {
    service = { getHealth: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: service }],
    }).compile();

    controller = module.get(AppController);
  });

  it("reports ok when the database is reachable", async () => {
    service.getHealth.mockResolvedValue({ status: "ok", database: "connected" });

    await expect(controller.getHealth()).resolves.toEqual({ status: "ok", database: "connected" });
  });

  it("reports error when the database is unreachable", async () => {
    service.getHealth.mockResolvedValue({ status: "error", database: "unreachable" });

    await expect(controller.getHealth()).resolves.toEqual({ status: "error", database: "unreachable" });
  });
});
