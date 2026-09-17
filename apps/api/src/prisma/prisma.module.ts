import { Global, Module } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

// Global so every future domain module can inject PrismaService without
// re-importing this module (the same client connection is shared app-wide).
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
