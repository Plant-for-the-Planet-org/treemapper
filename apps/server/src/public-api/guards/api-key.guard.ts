import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DrizzleService } from '../../database/drizzle.service';
import { project, projectApiKey } from '../../database/schema';
import { hashApiKey } from '../../common/utils/api-key.util';

const API_KEY_HEADER = 'x-api-key';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly drizzleService: DrizzleService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const headerValue = request.headers?.[API_KEY_HEADER];
    const apiKey = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    if (!apiKey) {
      throw new UnauthorizedException('Missing API key');
    }

    const keyHash = hashApiKey(apiKey);

    const [row] = await this.drizzleService.db
      .select({
        keyId: projectApiKey.id,
        projectId: project.id,
        projectUid: project.uid,
        apiEnabled: project.apiEnabled,
        projectDeletedAt: project.deletedAt,
      })
      .from(projectApiKey)
      .innerJoin(project, eq(projectApiKey.projectId, project.id))
      .where(and(eq(projectApiKey.keyHash, keyHash), isNull(projectApiKey.revokedAt)))
      .limit(1);

    if (!row) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (!row.apiEnabled || row.projectDeletedAt) {
      throw new ForbiddenException('API access is disabled for this project');
    }

    request.apiProject = { id: row.projectId, uid: row.projectUid };

    this.drizzleService.db
      .update(projectApiKey)
      .set({ lastUsedAt: new Date() })
      .where(eq(projectApiKey.id, row.keyId))
      .catch(() => undefined);

    return true;
  }
}
