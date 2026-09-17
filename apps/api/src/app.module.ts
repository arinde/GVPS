import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "@/app.controller";
import { AppService } from "@/app.service";
import { AcademicModule } from "@/academic/academic.module";
import { StudentsModule } from "@/students/students.module";
import { AuditModule } from "@/audit/audit.module";
import { AuthModule } from "@/auth/auth.module";
import { PrismaModule } from "@/prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,
    AuthModule,
    AcademicModule,
    StudentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
