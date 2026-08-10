import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { form, FormSchema } from '../database/schema';
import { DrizzleService } from '../database/drizzle.service';
import { AuditService } from '../audit/audit.service';
import { generateUid } from 'src/util/uidGenerator';
import { ProjectGuardResponse } from 'src/projects/projects.service';
import { CreateFormDto, UpdateFormDto, QueryFormsDto } from './dto/form.dto';

const EMPTY_SCHEMA: FormSchema = { sections: [] };

@Injectable()
export class FormsService {
  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Shape a DB row into the form object the web app consumes
   * (apps/web/src/forms/types.ts `Form`): `uid` -> `id`, the project's uid
   * -> `projectId`, and the jsonb `schema.sections` lifted to the top level.
   */
  private toResponse(row: typeof form.$inferSelect, projectUid: string) {
    return {
      id: row.uid,
      name: row.name,
      description: row.description ?? '',
      projectId: projectUid,
      status: row.status,
      siteAssignment: row.siteAssignment,
      siteIds: row.siteIds ?? [],
      interventionAssignment: row.interventionAssignment,
      interventionTypes: row.interventionTypes ?? [],
      sections: (row.schema as FormSchema)?.sections ?? [],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async listForms(membership: ProjectGuardResponse, projectUid: string, query: QueryFormsDto = {}) {
    const where = [eq(form.projectId, membership.projectId), isNull(form.deletedAt)];
    if (query.status) where.push(eq(form.status, query.status));

    const rows = await this.drizzleService.db
      .select()
      .from(form)
      .where(and(...where))
      .orderBy(desc(form.updatedAt));

    return rows.map((row) => this.toResponse(row, projectUid));
  }

  async getForm(membership: ProjectGuardResponse, projectUid: string, formUid: string) {
    const row = await this.findOwnedForm(membership.projectId, formUid);
    return this.toResponse(row, projectUid);
  }

  async createForm(membership: ProjectGuardResponse, projectUid: string, dto: CreateFormDto) {
    const status = dto.status ?? 'draft';
    const [created] = await this.drizzleService.db
      .insert(form)
      .values({
        uid: generateUid('form'),
        projectId: membership.projectId,
        createdById: membership.userId,
        name: dto.name,
        description: dto.description ?? null,
        status,
        siteAssignment: dto.siteAssignment ?? 'all',
        siteIds: dto.siteIds ?? [],
        interventionAssignment: dto.interventionAssignment ?? 'all',
        interventionTypes: (dto.interventionTypes ?? []) as typeof form.$inferInsert.interventionTypes,
        schema: (dto.schema as FormSchema) ?? EMPTY_SCHEMA,
        publishedAt: status === 'published' ? new Date() : null,
      })
      .returning();

    this.auditService.log('form', {
      action: 'create',
      entityId: created.id,
      entityUid: created.uid,
      userId: membership.userId,
      projectId: membership.projectId,
      source: 'web',
      newValues: { name: created.name, status: created.status },
    });

    return this.toResponse(created, projectUid);
  }

  async updateForm(membership: ProjectGuardResponse, projectUid: string, formUid: string, dto: UpdateFormDto) {
    const existing = await this.findOwnedForm(membership.projectId, formUid);

    const updates: Partial<typeof form.$inferInsert> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.siteAssignment !== undefined) updates.siteAssignment = dto.siteAssignment;
    if (dto.siteIds !== undefined) updates.siteIds = dto.siteIds;
    if (dto.interventionAssignment !== undefined) updates.interventionAssignment = dto.interventionAssignment;
    if (dto.interventionTypes !== undefined) {
      updates.interventionTypes = dto.interventionTypes as typeof form.$inferInsert.interventionTypes;
    }
    if (dto.schema !== undefined) updates.schema = dto.schema as FormSchema;
    if (dto.status !== undefined) {
      updates.status = dto.status;
      // Stamp the first publish; clear it again if moved back to draft.
      if (dto.status === 'published' && !existing.publishedAt) {
        updates.publishedAt = new Date();
      } else if (dto.status === 'draft') {
        updates.publishedAt = null;
      }
    }

    const [updated] = await this.drizzleService.db
      .update(form)
      .set(updates)
      .where(eq(form.id, existing.id))
      .returning();

    this.auditService.log('form', {
      action: 'update',
      entityId: updated.id,
      entityUid: updated.uid,
      userId: membership.userId,
      projectId: membership.projectId,
      source: 'web',
      oldValues: { name: existing.name, status: existing.status },
      newValues: { name: updated.name, status: updated.status },
    });

    return this.toResponse(updated, projectUid);
  }

  async deleteForm(membership: ProjectGuardResponse, formUid: string) {
    const existing = await this.findOwnedForm(membership.projectId, formUid);

    await this.drizzleService.db
      .update(form)
      .set({ deletedAt: new Date() })
      .where(eq(form.id, existing.id));

    this.auditService.log('form', {
      action: 'soft_delete',
      entityId: existing.id,
      entityUid: existing.uid,
      userId: membership.userId,
      projectId: membership.projectId,
      source: 'web',
    });

    return { success: true };
  }

  /**
   * Fetch a non-deleted form and assert it belongs to the project. Scoping by
   * projectId here means a form cannot be read or edited under a project it
   * does not belong to, even with a valid uid.
   */
  private async findOwnedForm(projectId: number, formUid: string) {
    const [row] = await this.drizzleService.db
      .select()
      .from(form)
      .where(and(eq(form.uid, formUid), eq(form.projectId, projectId), isNull(form.deletedAt)))
      .limit(1);

    if (!row) throw new NotFoundException('Form not found');
    return row;
  }
}
