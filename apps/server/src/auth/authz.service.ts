import { ForbiddenException, Injectable } from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { DrizzleService } from '../database/drizzle.service';
import { projectMember } from '../database/schema';

export type ProjectRole = 'owner' | 'admin' | 'contributor' | 'observer';

const ROLE_RANK: Record<ProjectRole, number> = {
  observer: 0,
  contributor: 1,
  admin: 2,
  owner: 3,
};

function rolesAtOrAbove(minRole: ProjectRole): ProjectRole[] {
  const min = ROLE_RANK[minRole];
  return (Object.keys(ROLE_RANK) as ProjectRole[]).filter((r) => ROLE_RANK[r] >= min);
}

@Injectable()
export class AuthzService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async assertProjectMembership(
    userId: number,
    projectId: number,
    minRole: ProjectRole = 'contributor',
  ): Promise<void> {
    const allowedRoles = rolesAtOrAbove(minRole);
    const [row] = await this.drizzleService.db
      .select({ id: projectMember.id })
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, projectId),
          eq(projectMember.userId, userId),
          inArray(projectMember.projectRole, allowedRoles),
          isNull(projectMember.deletedAt),
        ),
      )
      .limit(1);
    if (!row) {
      throw new ForbiddenException('Project membership required');
    }
  }
}
