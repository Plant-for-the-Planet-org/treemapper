import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ProjectGuardResponse } from '../../projects/projects.service';

/**
 * TreeMatch needs a real membership of the project, not an inherited one.
 *
 * `ProjectPermissionsGuard` falls back to the workspace: someone who owns or
 * admins the workspace but holds no `project_member` row is handed a
 * synthesized membership with `role: 'admin'`. That is the right call for most
 * of the app, but not here. Matching claims a project's trees and writes
 * absolute totals to TTC on its behalf, and there is no unmatch route, so the
 * people who can do it are the ones the owner actually put on the project.
 *
 * Runs after `ProjectPermissionsGuard`, which has already resolved the
 * membership and checked the role, so this only has to reject the inherited
 * case. Guards run in the order they are listed in `@UseGuards`.
 */
@Injectable()
export class TreeMatchAccessGuard implements CanActivate {
  private readonly logger = new Logger(TreeMatchAccessGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const membership: ProjectGuardResponse | undefined = request.membership;

    // No membership means ProjectPermissionsGuard did not run ahead of this one.
    // Refuse rather than assume: a missing check is not a passing check.
    if (!membership) {
      this.logger.error(
        `[TreeMatchGuard] DENY: no membership on ${request.method} ${request.url}. ` +
        'TreeMatchAccessGuard must be listed after ProjectPermissionsGuard.',
      );
      throw new ForbiddenException('You do not have access to this project');
    }

    if (membership.viaWorkspaceAdmin) {
      this.logger.warn(
        `[TreeMatchGuard] DENY: userId=${membership.userId} reaches ` +
        `projectId=${membership.projectId} through the workspace, not a project membership`,
      );
      throw new ForbiddenException(
        'TreeMatch is limited to the owner and admins of this project. ' +
        'A workspace role alone is not enough; ask the project owner to add you to the project.',
      );
    }

    return true;
  }
}
