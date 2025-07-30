import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { DrizzleService } from '../../database/drizzle.service';
import { intervention, projectSpecies, scientificSpecies } from '../../database/schema';
import { CreateUserSpeciesDto, UpdateUserSpeciesDto, UserSpeciesFilterDto } from '../dto/user-species.dto';
import { eq, and, ilike, or, desc, sql, is, isNotNull } from 'drizzle-orm';
import { ProjectGuardResponse } from 'src/projects/projects.service';
import { generateUid } from 'src/util/uidGenerator';

@Injectable()
export class ProjectSpeciesService {
  constructor(
    private readonly drizzle: DrizzleService,
  ) { }

  async create(
    membership: ProjectGuardResponse,
    createDto: CreateUserSpeciesDto,
  ) {

    const scientificSpeciesExists = await this.drizzle.db
      .select()
      .from(scientificSpecies)
      .where(eq(scientificSpecies.id, createDto.scientificSpeciesId))
      .limit(1);

    if (!scientificSpeciesExists.length) {
      throw new NotFoundException('Scientific species not found');
    }

    const existingUserSpecies = await this.drizzle.db
      .select()
      .from(projectSpecies)
      .where(
        and(
          eq(projectSpecies.addedById, membership.userId),
          eq(projectSpecies.projectId, membership.projectId),
          eq(projectSpecies.scientificSpeciesId, createDto.scientificSpeciesId),
        ),
      )
      .limit(1);

    if (existingUserSpecies.length > 0) {
      throw new ConflictException('You have already added this species to this project');
    }


    // Auto-populate fields from scientific species
    const scientificSpeciesData = scientificSpeciesExists[0];

    const newUserSpecies = await this.drizzle.db
      .insert(projectSpecies)
      .values({
        uid: generateUid('projspc'),
        projectId: membership.projectId,
        addedById: membership.userId,
        scientificSpeciesId: createDto.scientificSpeciesId,
        commonName: createDto.commonName,
        isNativeSpecies: createDto.isNativeSpecies || false,
        isDisabled: createDto.isDisbaledSpecies || false,
        description: createDto.description || scientificSpeciesData.description,
        notes: createDto.notes,
        favourite: createDto.favourite || false,
        metadata: createDto.metadata || null,
        image: createDto.image || ''
      })
      .returning();

    return newUserSpecies[0];
  }

  async delete(speciesId: string, membership: ProjectGuardResponse) {
    const existingSpecies = await this.getByUid(speciesId, membership.projectId);

    if (!existingSpecies) {
      throw new BadRequestException('Species does not have an image to delete');
    }

    const deletedSpecies = await this.drizzle.db
      .delete(projectSpecies)
      .where(
        and(
          eq(projectSpecies.id, existingSpecies.id),
          eq(projectSpecies.projectId, membership.projectId),
        ),
      )
      .returning();

    if (!deletedSpecies.length) {
      throw new NotFoundException('User species not found');
    }
    return { message: 'Species deleted successfully' };
  }

  async getByUid(uid: string, projectId: number) {
    const species = await this.drizzle.db
      .select({
        id: projectSpecies.id,
        uid: projectSpecies.uid,
        commonName: projectSpecies.commonName,
        image: projectSpecies.image,
        description: projectSpecies.description,
        notes: projectSpecies.notes,
        favourite: projectSpecies.favourite,
        createdAt: projectSpecies.createdAt,
        updatedAt: projectSpecies.updatedAt,
        scientificSpecies: {
          id: scientificSpecies.id,
          uid: scientificSpecies.uid,
          scientificName: scientificSpecies.scientificName,
          commonName: scientificSpecies.commonName,
          description: scientificSpecies.description,
          gbifId: scientificSpecies.gbifId,
        },
      })
      .from(projectSpecies)
      .leftJoin(scientificSpecies, eq(projectSpecies.scientificSpeciesId, scientificSpecies.id))
      .where(
        and(
          eq(projectSpecies.uid, uid),
          eq(projectSpecies.projectId, projectId),
        ),
      )
      .limit(1);

    if (!species.length) {
      throw new NotFoundException('User species not found');
    }

    return species[0];
  }

  async update(
    speciesId: string,
    membership: ProjectGuardResponse,
    updateDto: UpdateUserSpeciesDto,
  ) {
    const existingSpecies = await this.getByUid(speciesId, membership.projectId);
    if (!existingSpecies) {
      throw new NotFoundException('User species not found');
    }

    const updatedSpecies = await this.drizzle.db
      .update(projectSpecies)
      .set({
        ...updateDto,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectSpecies.id, existingSpecies.id),
          eq(projectSpecies.projectId, membership.projectId),
        ),
      )
      .returning();

    if (!updatedSpecies.length) {
      throw new NotFoundException('User species not found');
    }

    return updatedSpecies[0]
  }
async getInterventionSpecies(membership: ProjectGuardResponse) {
  return this.drizzle.db
    .select({
      interventionUid: intervention.uid,
      interventionHid: intervention.hid,
      interventionType: intervention.type,
      species: intervention.species,
      registrationDate: intervention.registrationDate,
      interventionStartDate: intervention.interventionStartDate,
      createdAt: intervention.createdAt,
    })
    .from(intervention)
    .where(
      and(
        eq(intervention.projectId, membership.projectId),
        isNotNull(intervention.species),
        sql`jsonb_array_length(${intervention.species}) > 0`
      )
    )
    .orderBy(desc(intervention.createdAt));
}

async getAll(membership: ProjectGuardResponse) {
  const [projectSpeciesData, interventionSpeciesData] = await Promise.all([
    this.drizzle.db
      .select({
        uid: projectSpecies.uid,
        scientificSpeciesId: projectSpecies.scientificSpeciesId,
        speciesName: projectSpecies.speciesName,
        scientificSpeciesUid: projectSpecies.scientificSpeciesUid,
        isUnknown: projectSpecies.isUnknown,
        commonName: projectSpecies.commonName,
        description: projectSpecies.description,
        isNativeSpecies: projectSpecies.isNativeSpecies,
        disbaled: projectSpecies.isDisabled,
        image: projectSpecies.image,
        favourite: projectSpecies.favourite,
        createdAt: projectSpecies.createdAt,
        updatedAt: projectSpecies.updatedAt,
        metadata: projectSpecies.metadata,
      })
      .from(projectSpecies)
      .where(eq(projectSpecies.projectId, membership.projectId)),
    
    this.getInterventionSpecies(membership)
  ]);

  // Process intervention species into known and unknown
  const { knownSpecies, unknownSpecies } = this.processInterventionSpecies(interventionSpeciesData);

  // Aggregate scientific species (project + known intervention species)
  const scientificSpecies = this.aggregateScientificSpecies(projectSpeciesData, knownSpecies);

  return {
    scientificSpecies,
    unknownSpecies
  };
}

private processInterventionSpecies(interventionData: any[]) {
  const knownSpecies:any = [];
  const unknownSpecies:any = [];

  interventionData.forEach(intervention => {
    const speciesArray = intervention.species as any[];
    
    speciesArray.forEach(species => {
      if (species.isUnknown) {
        // Keep unknown species separate with intervention context
        unknownSpecies.push({
          clientId: species.clientId,
          speciesName: species.speciesName,
          count: Number(species.count) || 0,
          interventionUid: intervention.interventionUid,
          interventionHid: intervention.interventionHid,
          interventionType: intervention.interventionType,
          createdAt: new Date(species.createdAt),
          updatedAt: species.updatedAt ? new Date(species.updatedAt) : null,
          isUnknown: true,
          scientificSpeciesUid: null,
          scientificSpeciesId: null
        });
      } else if (species.scientificSpeciesUid) {
        // Collect known species for aggregation
        knownSpecies.push({
          speciesName: species.speciesName,
          scientificSpeciesUid: species.scientificSpeciesUid,
          scientificSpeciesId: species.scientificSpeciesId,
          count: Number(species.count) || 0,
          interventionUid: intervention.interventionUid,
          interventionHid: intervention.interventionHid,
          interventionType: intervention.interventionType,
          createdAt: new Date(species.createdAt),
          updatedAt: species.updatedAt ? new Date(species.updatedAt) : null,
          isUnknown: false
        });
      }
    });
  });

  return { knownSpecies, unknownSpecies };
}

private aggregateScientificSpecies(projectSpecies: any[], interventionKnownSpecies: any[]) {
  const aggregatedMap = new Map();

  // Add project species
  projectSpecies.forEach(species => {
    if (species.scientificSpeciesUid) {
      const key = species.scientificSpeciesUid;
      aggregatedMap.set(key, {
        uid: species.uid,
        scientificSpeciesUid: species.scientificSpeciesUid,
        scientificSpeciesId: species.scientificSpeciesId,
        speciesName: species.speciesName,
        commonName: species.commonName,
        description: species.description,
        isNativeSpecies: species.isNativeSpecies,
        isDisabled: species.disbaled,
        image: species.image,
        favourite: species.favourite,
        sources: ['project'],
        totalCount: 0,
        interventionCount: 0,
        interventionTypes: [],
        projectCreatedAt: species.createdAt,
        projectUpdatedAt: species.updatedAt,
        metadata: species.metadata
      });
    }
  });

  // Aggregate intervention known species
  interventionKnownSpecies.forEach(species => {
    const key = species.scientificSpeciesUid;
    
    if (aggregatedMap.has(key)) {
      // Update existing entry (from project species)
      const existing = aggregatedMap.get(key);
      existing.sources.push('intervention');
      existing.sources = [...new Set(existing.sources)]; // Remove duplicates
      existing.totalCount += species.count;
      existing.interventionCount += 1;
      
      if (!existing.interventionTypes.includes(species.interventionType)) {
        existing.interventionTypes.push(species.interventionType);
      }
    } else {
      // Create new entry for intervention-only species
      if (aggregatedMap.has(key)) {
        const existing = aggregatedMap.get(key);
        existing.totalCount += species.count;
        existing.interventionCount += 1;
        
        if (!existing.interventionTypes.includes(species.interventionType)) {
          existing.interventionTypes.push(species.interventionType);
        }
      } else {
        aggregatedMap.set(key, {
          scientificSpeciesUid: species.scientificSpeciesUid,
          scientificSpeciesId: species.scientificSpeciesId,
          speciesName: species.speciesName,
          sources: ['intervention'],
          totalCount: species.count,
          interventionCount: 1,
          interventionTypes: [species.interventionType],
          interventionCreatedAt: species.createdAt,
          interventionUpdatedAt: species.updatedAt
        });
      }
    }
  });

  // Aggregate intervention counts for species that appear multiple times
  const countMap = new Map();
  interventionKnownSpecies.forEach(species => {
    const key = species.scientificSpeciesUid;
    if (countMap.has(key)) {
      countMap.get(key).count += species.count;
      countMap.get(key).interventionCount += 1;
      countMap.get(key).interventionTypes.add(species.interventionType);
    } else {
      countMap.set(key, {
        count: species.count,
        interventionCount: 1,
        interventionTypes: new Set([species.interventionType])
      });
    }
  });

  // Update aggregated data with correct counts
  Array.from(aggregatedMap.values()).forEach(species => {
    if (countMap.has(species.scientificSpeciesUid)) {
      const counts = countMap.get(species.scientificSpeciesUid);
      species.totalCount = counts.count;
      species.interventionCount = counts.interventionCount;
      species.interventionTypes = Array.from(counts.interventionTypes);
    }
  });

  return Array.from(aggregatedMap.values());
}







  // async getById(id: number, userId: number, projectId: number) {
  //   const species = await this.drizzle.db
  //     .select({
  //       id: userSpecies.id,
  //       uid: userSpecies.uid,
  //       aliases: userSpecies.aliases,
  //       localName: userSpecies.localName,
  //       image: userSpecies.image,
  //       description: userSpecies.description,
  //       notes: userSpecies.notes,
  //       favourite: userSpecies.favourite,
  //       createdAt: userSpecies.createdAt,
  //       updatedAt: userSpecies.updatedAt,
  //       scientificSpecies: {
  //         id: scientificSpecies.id,
  //         uid: scientificSpecies.uid,
  //         scientificName: scientificSpecies.scientificName,
  //         commonName: scientificSpecies.commonName,
  //         description: scientificSpecies.description,
  //         image: scientificSpecies.image,
  //         gbifId: scientificSpecies.gbifId,
  //       },
  //     })
  //     .from(userSpecies)
  //     .leftJoin(scientificSpecies, eq(userSpecies.scientificSpeciesId, scientificSpecies.id))
  //     .where(
  //       and(
  //         eq(userSpecies.id, id),
  //         eq(userSpecies.userId, userId),
  //         eq(userSpecies.projectId, projectId),
  //       ),
  //     )
  //     .limit(1);

  //   if (!species.length) {
  //     throw new NotFoundException('User species not found');
  //   }

  //   return species[0];
  // }

  // async getAll(userId: number, projectId: number, filterDto: UserSpeciesFilterDto) {
  //   const { page = 1, limit = 10, search, favouriteOnly } = filterDto;
  //   const offset = (page - 1) * limit;

  //   let whereConditions = [
  //     eq(userSpecies.userId, userId),
  //     eq(userSpecies.projectId, projectId),
  //   ];

  //   if (favouriteOnly) {
  //     whereConditions.push(eq(userSpecies.favourite, true));
  //   }

  //   if (search) {
  //     whereConditions.push(
  //       or(
  //         ilike(userSpecies.localName, `%${search}%`),
  //         ilike(scientificSpecies.scientificName, `%${search}%`),
  //         ilike(scientificSpecies.commonName, `%${search}%`),
  //       ),
  //     );
  //   }

  //   const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  //   const [data, totalResult, totalSpeciesResult, totalFavouriteResult] = await Promise.all([
  //     this.drizzle.db
  //       .select({
  //         id: userSpecies.id,
  //         uid: userSpecies.uid,
  //         aliases: userSpecies.aliases,
  //         localName: userSpecies.localName,
  //         image: userSpecies.image,
  //         description: userSpecies.description,
  //         notes: userSpecies.notes,
  //         favourite: userSpecies.favourite,
  //         createdAt: userSpecies.createdAt,
  //         updatedAt: userSpecies.updatedAt,
  //         scientificSpecies: {
  //           id: scientificSpecies.id,
  //           uid: scientificSpecies.uid,
  //           scientificName: scientificSpecies.scientificName,
  //           commonName: scientificSpecies.commonName,
  //           description: scientificSpecies.description,
  //           image: scientificSpecies.image,
  //           gbifId: scientificSpecies.gbifId,
  //         },
  //       })
  //       .from(userSpecies)
  //       .leftJoin(scientificSpecies, eq(userSpecies.scientificSpeciesId, scientificSpecies.id))
  //       .where(whereClause ? whereClause : sql`TRUE`)
  //       .orderBy(desc(userSpecies.createdAt))
  //       .limit(limit)
  //       .offset(offset),

  //     this.drizzle.db
  //       .select({ count: sql<number>`count(*)` })
  //       .from(userSpecies)
  //       .leftJoin(scientificSpecies, eq(userSpecies.scientificSpeciesId, scientificSpecies.id))
  //       .where(whereClause ? whereClause : sql`TRUE`),

  //     this.drizzle.db
  //       .select({ count: sql<number>`count(*)` })
  //       .from(userSpecies)
  //       .where(and(eq(userSpecies.userId, userId), eq(userSpecies.projectId, projectId))),

  //     this.drizzle.db
  //       .select({ count: sql<number>`count(*)` })
  //       .from(userSpecies)
  //       .where(
  //         and(
  //           eq(userSpecies.userId, userId),
  //           eq(userSpecies.projectId, projectId),
  //           eq(userSpecies.favourite, true),
  //         ),
  //       ),
  //   ]);

  //   const total = totalResult[0]?.count || 0;
  //   const totalSpecies = totalSpeciesResult[0]?.count || 0;
  //   const totalFavouriteSpecies = totalFavouriteResult[0]?.count || 0;

  //   return {
  //     data,
  //     total,
  //     page,
  //     limit,
  //     totalPages: Math.ceil(total / limit),
  //     totalSpecies,
  //     totalFavouriteSpecies,
  //   };
  // }

  // async getById(id: number, userId: number, projectId: number) {
  //   const species = await this.drizzle.db
  //     .select({
  //       id: userSpecies.id,
  //       uid: userSpecies.uid,
  //       aliases: userSpecies.aliases,
  //       localName: userSpecies.localName,
  //       image: userSpecies.image,
  //       description: userSpecies.description,
  //       notes: userSpecies.notes,
  //       favourite: userSpecies.favourite,
  //       createdAt: userSpecies.createdAt,
  //       updatedAt: userSpecies.updatedAt,
  //       scientificSpecies: {
  //         id: scientificSpecies.id,
  //         uid: scientificSpecies.uid,
  //         scientificName: scientificSpecies.scientificName,
  //         commonName: scientificSpecies.commonName,
  //         description: scientificSpecies.description,
  //         image: scientificSpecies.image,
  //         gbifId: scientificSpecies.gbifId,
  //       },
  //     })
  //     .from(userSpecies)
  //     .leftJoin(scientificSpecies, eq(userSpecies.scientificSpeciesId, scientificSpecies.id))
  //     .where(
  //       and(
  //         eq(userSpecies.id, id),
  //         eq(userSpecies.userId, userId),
  //         eq(userSpecies.projectId, projectId),
  //       ),
  //     )
  //     .limit(1);

  //   if (!species.length) {
  //     throw new NotFoundException('User species not found');
  //   }

  //   return species[0];
  // }

  // async update(
  //   id: number,
  //   userId: number,
  //   projectId: number,
  //   updateDto: UpdateUserSpeciesDto,
  //   imageFile?: Express.Multer.File,
  // ) {
  //   const existingSpecies = await this.getById(id, userId, projectId);

  //   let imageUrl = existingSpecies.image;

  //   if (imageFile) {
  //     // Delete old image if exists
  //     if (existingSpecies.image) {
  //       try {
  //         await this.awsS3Service.deleteImage(existingSpecies.image);
  //       } catch (error) {
  //         console.warn('Failed to delete old image:', error);
  //       }
  //     }
  //     imageUrl = await this.awsS3Service.uploadImage(imageFile, 'user-species');
  //   }

  //   const updatedSpecies = await this.drizzle.db
  //     .update(userSpecies)
  //     .set({
  //       ...updateDto,
  //       image: imageUrl,
  //       updatedAt: new Date(),
  //     })
  //     .where(
  //       and(
  //         eq(userSpecies.id, id),
  //         eq(userSpecies.userId, userId),
  //         eq(userSpecies.projectId, projectId),
  //       ),
  //     )
  //     .returning();

  //   if (!updatedSpecies.length) {
  //     throw new NotFoundException('User species not found');
  //   }

  //   return this.getById(id, userId, projectId);
  // }

  // async updateFavourite(id: number, userId: number, projectId: number, favourite: boolean) {
  //   const updatedSpecies = await this.drizzle.db
  //     .update(userSpecies)
  //     .set({
  //       favourite,
  //       updatedAt: new Date(),
  //     })
  //     .where(
  //       and(
  //         eq(userSpecies.id, id),
  //         eq(userSpecies.userId, userId),
  //         eq(userSpecies.projectId, projectId),
  //       ),
  //     )
  //     .returning();

  //   if (!updatedSpecies.length) {
  //     throw new NotFoundException('User species not found');
  //   }

  //   return this.getById(id, userId, projectId);
  // }

  // async delete(id: number, userId: number, projectId: number) {
  //   const existingSpecies = await this.getById(id, userId, projectId);

  //   // Delete image from S3 if exists
  //   if (existingSpecies.image) {
  //     try {
  //       await this.awsS3Service.deleteImage(existingSpecies.image);
  //     } catch (error) {
  //       console.warn('Failed to delete image from S3:', error);
  //     }
  //   }

  //   const deletedSpecies = await this.drizzle.db
  //     .delete(userSpecies)
  //     .where(
  //       and(
  //         eq(userSpecies.id, id),
  //         eq(userSpecies.userId, userId),
  //         eq(userSpecies.projectId, projectId),
  //       ),
  //     )
  //     .returning();

  //   if (!deletedSpecies.length) {
  //     throw new NotFoundException('User species not found');
  //   }

  //   return { message: 'Species deleted successfully' };
  // }
}
