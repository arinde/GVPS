import { Controller, Get, Header, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { NIGERIAN_STATES } from "@/reference/nigeria-states";
import { NEXT_OF_KIN_RELATIONSHIPS, NIGERIAN_BANKS } from "@/reference/staff-reference";
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

  @Get("banks")
  @Header("Cache-Control", "private, max-age=86400")
  banks() {
    return NIGERIAN_BANKS;
  }

  @Get("next-of-kin-relationships")
  @Header("Cache-Control", "private, max-age=86400")
  nextOfKinRelationships() {
    return NEXT_OF_KIN_RELATIONSHIPS;
  }
}
