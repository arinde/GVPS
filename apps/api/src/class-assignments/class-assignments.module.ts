import { Module } from "@nestjs/common";
import { ClassAssignmentsController } from "@/class-assignments/class-assignments.controller";
import { ClassAssignmentsService } from "@/class-assignments/class-assignments.service";

// Which teacher is in charge of which class, per session (FEATURES.md §2.4).
@Module({
  controllers: [ClassAssignmentsController],
  providers: [ClassAssignmentsService],
})
export class ClassAssignmentsModule {}
