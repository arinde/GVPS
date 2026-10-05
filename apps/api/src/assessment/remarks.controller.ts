import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { RemarksService } from "@/assessment/remarks.service";
import { RemarkSchema, type RemarkDto } from "@/assessment/schemas/remark.schema";

// Who may write each part is decided in the service (form teacher, principal).
@Controller("assessment/remarks")
@UseGuards(JwtAuthGuard)
export class RemarksController {
  constructor(private readonly remarks: RemarksService) {}

  @Get("terms/:termId/arms/:classArmId")
  listForArm(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("termId") termId: string,
    @Param("classArmId") classArmId: string,
  ) {
    return this.remarks.listForArm(actor, termId, classArmId);
  }

  @Put("terms/:termId/students/:studentId")
  save(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("termId") termId: string,
    @Param("studentId") studentId: string,
    @Body(new ZodValidationPipe(RemarkSchema)) body: RemarkDto,
  ) {
    return this.remarks.save(actor, termId, studentId, body);
  }
}
