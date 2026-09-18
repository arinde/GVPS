import { Controller, Get, Header, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { NIGERIAN_STATES } from "@/reference/nigeria-states";
import { BLOOD_GROUPS } from "@/students/schemas/create-student.schema";

/**
 * Fixed lists the forms need. Served from the API, not bundled into the web
 * app, so the list the form offers is the same list the API validates against
 * — one source of truth, no drift.
 */
@Controller("reference")
@UseGuards(JwtAuthGuard)
export class ReferenceController {
  // The data only changes with a deploy, so let the browser keep it for a day
  // rather than fetch ~20KB of LGAs on every registration.
  @Get("states")
  @Header("Cache-Control", "private, max-age=86400")
  states() {
    return NIGERIAN_STATES;
  }

  @Get("blood-groups")
  @Header("Cache-Control", "private, max-age=86400")
  bloodGroups() {
    return BLOOD_GROUPS;
  }
}
