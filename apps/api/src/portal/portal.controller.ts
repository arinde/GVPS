import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { CurrentParent, ParentAuthGuard, type AuthenticatedParent } from "@/portal/parent-auth.primitives";
import { PortalService } from "@/portal/portal.service";

// The family portal's reads. Parent tokens only; the service limits every
// read to the signed-in parent's own children.
@Controller("portal")
@UseGuards(ParentAuthGuard)
export class PortalController {
  constructor(private readonly portal: PortalService) {}

  @Get("me")
  me(@CurrentParent() parent: AuthenticatedParent) {
    return this.portal.me(parent);
  }

  @Get("children")
  children(@CurrentParent() parent: AuthenticatedParent) {
    return this.portal.listChildren(parent);
  }

  @Get("children/:studentId")
  child(@CurrentParent() parent: AuthenticatedParent, @Param("studentId") studentId: string) {
    return this.portal.child(parent, studentId);
  }

  @Get("children/:studentId/photo")
  photo(@CurrentParent() parent: AuthenticatedParent, @Param("studentId") studentId: string) {
    return this.portal.photo(parent, studentId);
  }
}
