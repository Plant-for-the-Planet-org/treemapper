import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { DatabaseModule } from 'src/database/database.module';

@Global()
@Module({
    imports: [DatabaseModule],
    providers: [AuditService],
    controllers: [AuditController],
    exports: [AuditService],
})
export class AuditModule { }

// Usage Example in your services:
/*
// In your project service
async updateProject(id: number, updateData: any, userData: User) {
  const oldProject = await this.getProjectById(id);
  
  const updatedProject = await this.drizzleService.db
    .update(project)
    .set(updateData)
    .where(eq(project.id, id))
    .returning();

  // Create audit log
  await this.auditService.createAuditLog('project', {
    action: 'update',
    entityId: id.toString(),
    entityUid: updatedProject[0].uid,
    userId: userData.id,
    workspaceId: updatedProject[0].workspaceId,
    projectId: id,
    oldValues: oldProject,
    newValues: updatedProject[0],
    source: 'web',
    ipAddress: 'user-ip-here'
  });

  return updatedProject[0];
}

// In your intervention service
async createIntervention(data: any, userData: User) {
  const [intervention] = await this.drizzleService.db
    .insert(interventions)
    .values(data)
    .returning();

  // Create audit log
  await this.auditService.createAuditLog('intervention', {
    action: 'create',
    entityId: intervention.id.toString(),
    entityUid: intervention.uid,
    userId: userData.id,
    projectId: intervention.projectId,
    newValues: intervention,
    source: 'web'
  });

  return intervention;
}
*/