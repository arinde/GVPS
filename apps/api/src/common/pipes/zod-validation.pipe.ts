import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";

/**
 * AGENTS.md §8: validate every API boundary with a zod schema and derive the
 * TypeScript type from it, rather than declaring both (class-validator DTOs
 * would do the latter).
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({ path: issue.path, message: issue.message }));
      throw new BadRequestException(issues);
    }
    return result.data;
  }
}
