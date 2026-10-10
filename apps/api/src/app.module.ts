import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "@/app.controller";
import { AppService } from "@/app.service";
import { AcademicModule } from "@/academic/academic.module";
import { AccessModule } from "@/access/access.module";
import { AnalyticsModule } from "@/analytics/analytics.module";
import { AssessmentModule } from "@/assessment/assessment.module";
import { AttendanceModule } from "@/attendance/attendance.module";
import { ClassAssignmentsModule } from "@/class-assignments/class-assignments.module";
import { DashboardModule } from "@/dashboard/dashboard.module";
import { PortalModule } from "@/portal/portal.module";
import { SubjectsModule } from "@/subjects/subjects.module";
import { EnquiriesModule } from "@/enquiries/enquiries.module";
import { PromotionsModule } from "@/promotions/promotions.module";
import { ReferenceModule } from "@/reference/reference.module";
import { ResultsModule } from "@/results/results.module";
import { StudentsModule } from "@/students/students.module";
import { AuditModule } from "@/audit/audit.module";
import { AuthModule } from "@/auth/auth.module";
import { EmailModule } from "@/common/email.module";
import { FeesModule } from "@/fees/fees.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { SchoolModule } from "@/school/school.module";
import { TimetableModule } from "@/timetable/timetable.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,
    EmailModule,
    AccessModule,
    AuthModule,
    AcademicModule,
    AnalyticsModule,
    AssessmentModule,
    AttendanceModule,
    StudentsModule,
    ReferenceModule,
    ClassAssignmentsModule,
    DashboardModule,
    PortalModule,
    SubjectsModule,
    EnquiriesModule,
    PromotionsModule,
    ResultsModule,
    FeesModule,
    SchoolModule,
    TimetableModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
