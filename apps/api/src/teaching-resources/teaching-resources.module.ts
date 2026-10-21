import { Module } from "@nestjs/common";
import { TeachingResourcesController } from "@/teaching-resources/teaching-resources.controller";
import { TeachingResourcesService } from "@/teaching-resources/teaching-resources.service";

@Module({
  controllers: [TeachingResourcesController],
  providers: [TeachingResourcesService],
})
export class TeachingResourcesModule {}
