import { Module } from "@nestjs/common";
import { BankScheduleService } from "@/payroll/bank-schedule.service";
import { PayrollRunsController } from "@/payroll/payroll-runs.controller";
import { PayrollRunsService } from "@/payroll/payroll-runs.service";
import { PayslipsController } from "@/payroll/payslips.controller";
import { PayslipsService } from "@/payroll/payslips.service";
import { SalariesController } from "@/payroll/salaries.controller";
import { SalariesService } from "@/payroll/salaries.service";

/** FEATURES.md §9.4 — salary structures, monthly payroll runs and payslips. */
@Module({
  controllers: [SalariesController, PayrollRunsController, PayslipsController],
  providers: [SalariesService, PayrollRunsService, PayslipsService, BankScheduleService],
})
export class PayrollModule {}
