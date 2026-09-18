import { Module } from "@nestjs/common";
import { ReferenceController } from "@/reference/reference.controller";

// Static reference data: states and LGAs, blood groups.
@Module({ controllers: [ReferenceController] })
export class ReferenceModule {}
