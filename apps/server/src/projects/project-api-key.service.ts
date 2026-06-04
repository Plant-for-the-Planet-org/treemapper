import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../database/drizzle.service';
import { projectApiKey } from '../database/schema';
import { generateApiKey } from '../common/utils/api-key.util';
import { generateUid } from '../util/uidGenerator';

@Injectable()
export class ProjectApiKeyService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async getStatus(projectId: number) {
    const [row] = await this.drizzleService.db
      .select({
        keyPrefix: projectApiKey.keyPrefix,
        lastUsedAt: projectApiKey.lastUsedAt,
        createdAt: projectApiKey.createdAt,
        revokedAt: projectApiKey.revokedAt,
      })
      .from(projectApiKey)
      .where(eq(projectApiKey.projectId, projectId))
      .limit(1);

    if (!row || row.revokedAt) {
      return { exists: false, keyPrefix: null, lastUsedAt: null, createdAt: null };
    }

    return {
      exists: true,
      keyPrefix: row.keyPrefix,
      lastUsedAt: row.lastUsedAt,
      createdAt: row.createdAt,
    };
  }

  async generate(projectId: number, userId: number) {
    const { plaintext, keyHash, keyPrefix } = generateApiKey();
    const now = new Date();

    const [row] = await this.drizzleService.db
      .insert(projectApiKey)
      .values({
        uid: generateUid('apikey'),
        projectId,
        keyHash,
        keyPrefix,
        createdById: userId,
        lastUsedAt: null,
        revokedAt: null,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: projectApiKey.projectId,
        set: {
          keyHash,
          keyPrefix,
          createdById: userId,
          lastUsedAt: null,
          revokedAt: null,
          createdAt: now,
          updatedAt: now,
        },
      })
      .returning({ keyPrefix: projectApiKey.keyPrefix, createdAt: projectApiKey.createdAt });

    return { apiKey: plaintext, keyPrefix: row.keyPrefix, createdAt: row.createdAt };
  }

  async revoke(projectId: number) {
    const result = await this.drizzleService.db
      .update(projectApiKey)
      .set({ revokedAt: new Date() })
      .where(eq(projectApiKey.projectId, projectId))
      .returning({ id: projectApiKey.id });

    if (!result.length) {
      throw new NotFoundException('No API key to revoke');
    }

    return { revoked: true };
  }
}
