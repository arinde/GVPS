import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Thin wrapper so Nest's DI and lifecycle hooks own the client's connection,
 * rather than a module-scope singleton every future module would import
 * around (AGENTS.md §3's per-request-store reasoning applies here too).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
