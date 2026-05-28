import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DrizzleService } from '../database/drizzle.service';
import { project, site } from '../database/schema';
import { ExternalService } from '../external/external.service';

@Injectable()
export class PublicApiService {
  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly externalService: ExternalService,
  ) {}

  async getProject(projectId: number): Promise<any> {
    const [row] = await this.drizzleService.db
      .select({
        uid: project.uid,
        name: project.name,
        slug: project.slug,
        description: project.description,
        purpose: project.purpose,
        type: project.type,
        ecosystem: project.ecosystem,
        scale: project.scale,
        classification: project.classification,
        target: project.target,
        country: project.country,
        website: project.website,
        image: project.image,
        videoUrl: project.videoUrl,
        location: project.location,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      })
      .from(project)
      .where(and(eq(project.id, projectId), isNull(project.deletedAt)))
      .limit(1);

    if (!row) {
      throw new NotFoundException('Project not found');
    }

    return row;
  }

  async getSites(projectId: number): Promise<any> {
    return this.drizzleService.db
      .select({
        uid: site.uid,
        name: site.name,
        description: site.description,
        location: site.location,
        area: site.area,
        status: site.status,
        soilType: site.soilType,
        elevation: site.elevation,
        slope: site.slope,
        aspect: site.aspect,
        plannedPlantingDate: site.plannedPlantingDate,
        actualPlantingDate: site.actualPlantingDate,
        expectedTreeCount: site.expectedTreeCount,
        image: site.image,
        createdAt: site.createdAt,
        updatedAt: site.updatedAt,
      })
      .from(site)
      .where(and(eq(site.projectId, projectId), isNull(site.deletedAt)));
  }

  async getInterventions(projectUid: string) {
    return this.externalService.getProjectInterventions(projectUid);
  }
}
