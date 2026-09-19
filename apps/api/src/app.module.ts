import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "@/app.controller";
import { AppService } from "@/app.service";
import { AcademicModule } from "@/academic/academic.module";
import { AccessModule } from "@/access/access.module";
import { ClassAssignmentsModule } from "@/class-assignments/class-assignments.module";
import { DashboardModule } from "@/dashboard/dashboard.module";
import { PortalModule } from "@/portal/portal.module";
import { ReferenceModule } from "@/reference/reference.module";
import { StudentsModule } from "@/students/students.module";
import { AuditModule } from "@/audit/audit.module";
import { AuthModule } from "@/auth/auth.module";
import { PrismaModule } from "@/prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,
    AccessModule,
    AuthModule,
    AcademicModule,
    StudentsModule,
    ReferenceModule,
    ClassAssignmentsModule,
    DashboardModule,
    PortalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
