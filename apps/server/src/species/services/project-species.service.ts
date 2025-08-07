import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { DrizzleService } from '../../database/drizzle.service';
import { intervention, interventionSpecies, projectSpecies, scientificSpecies, user } from '../../database/schema';
import { CreateUserSpeciesDto, UpdateUserSpeciesDto, UserSpeciesFilterDto } from '../dto/user-species.dto';
import { eq, and, ilike, or, desc, sql, is, isNotNull, isNull } from 'drizzle-orm';
import { ProjectGuardResponse } from 'src/projects/projects.service';
import { generateUid } from 'src/util/uidGenerator';


export interface KnownSpeciesResponse {
  scientificSpeciesId: number;
  scientificName: string;
  commonName: string | null;
  speciesName: string;
  image: string | null;
  
  // Project species data
  isInProjectSpecies: boolean;
  isFavourite: boolean;
  projectSpeciesNotes: string | null;
  
  // Intervention usage
  interventionUsageCount: number;
  totalSpecimenCount: number;
  interventionIds: number[];
  
  // Additional metadata
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface UnknownSpeciesResponse {
  uid: string;
  speciesName: string | null;
  commonName: string | null;
  interventionId: number;
  interventionUid: string;
  interventionHid: string;
  speciesCount: number;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectSpeciesAggregatedResponse {
  knownSpecies: KnownSpeciesResponse[];
  unknownSpecies: UnknownSpeciesResponse[];
  summary: {
    totalKnownSpecies: number;
    totalUnknownSpecies: number;
    totalProjectSpecies: number;
    totalInterventionSpecies: number;
  };
}


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

    const scientificSpeciesData = scientificSpeciesExists[0];
    const newUserSpecies = await this.drizzle.db
      .insert(projectSpecies)
      .values({
        uid: generateUid('projspc'),
        projectId: membership.projectId,
        addedById: membership.userId,
        scientificSpeciesId: createDto.scientificSpeciesId,
        speciesName: scientificSpeciesData.scientificName,
        isUnknown: false,
        commonName: createDto.commonName,
        isDisabled: createDto.isDisbaledSpecies || false,
        notes: createDto.description,
        favourite: createDto.favourite || false,
        image: createDto.image || ''
      })
      .returning();
    return newUserSpecies[0];
  }

 async getProjectSpeciesAggregated(projectId: number): Promise<ProjectSpeciesAggregatedResponse> {
    // Get all known species (with scientificSpeciesId) from both tables
    const knownSpeciesQuery = await this.drizzle.db
      .select({
        scientificSpeciesId: sql<number>`COALESCE(${projectSpecies.scientificSpeciesId}, ${interventionSpecies.scientificSpeciesId})`,
        scientificName: scientificSpecies.scientificName,
        
        // Priority: project species common name first
        commonName: sql<string>`COALESCE(${projectSpecies.commonName}, ${interventionSpecies.commonName})`,
        speciesName: sql<string>`COALESCE(${projectSpecies.speciesName}, ${interventionSpecies.speciesName})`,
        
        // Project species data
        projectSpeciesId: projectSpecies.id,
        projectCommonName: projectSpecies.commonName,
        projectSpeciesName: projectSpecies.speciesName,
        isFavourite: sql<boolean>`COALESCE(${projectSpecies.favourite}, false)`,
        projectSpeciesNotes: projectSpecies.notes,
        projectSpeciesImage: projectSpecies.image,
        projectSpeciesCreatedAt: projectSpecies.createdAt,
        projectSpeciesUpdatedAt: projectSpecies.updatedAt,
        
      // Intervention data
        interventionSpeciesId: interventionSpecies.id,
        interventionCommonName: interventionSpecies.commonName,
        interventionSpeciesName: interventionSpecies.speciesName,
        interventionId: interventionSpecies.interventionId,
        speciesCount: interventionSpecies.speciesCount,
        interventionSpeciesCreatedAt: interventionSpecies.createdAt,
        interventionSpeciesUpdatedAt: interventionSpecies.updatedAt,
      })
      .from(scientificSpecies)
      .leftJoin(
        projectSpecies,
        and(
          eq(projectSpecies.scientificSpeciesId, scientificSpecies.id),
          eq(projectSpecies.projectId, projectId),
          isNull(projectSpecies.deletedAt)
        )
      )
      .leftJoin(
        interventionSpecies,
        and(
          eq(interventionSpecies.scientificSpeciesId, scientificSpecies.id),
          isNotNull(interventionSpecies.scientificSpeciesId)
        )
      )
      .leftJoin(
        intervention,
        and(
          eq(intervention.id, interventionSpecies.interventionId),
          eq(intervention.projectId, projectId),
          isNull(intervention.deletedAt)
        )
      )
      .where(
        sql`(${projectSpecies.id} IS NOT NULL OR ${interventionSpecies.id} IS NOT NULL)`
      );

    // Get unknown species separately
    const unknownSpeciesQuery = await this.drizzle.db
      .select({
        uid: interventionSpecies.uid,
        speciesName: interventionSpecies.speciesName,
        commonName: interventionSpecies.commonName,
        interventionId: interventionSpecies.interventionId,
        interventionUid: intervention.uid,
        interventionHid: intervention.hid,
        speciesCount: interventionSpecies.speciesCount,
        image: sql<string>`NULL`, // Unknown species typically don't have images
        createdAt: interventionSpecies.createdAt,
        updatedAt: interventionSpecies.updatedAt,
      })
      .from(interventionSpecies)
      .innerJoin(
        intervention,
        and(
          eq(intervention.id, interventionSpecies.interventionId),
          eq(intervention.projectId, projectId),
          isNull(intervention.deletedAt)
        )
      )
      .where(
        and(
          eq(interventionSpecies.isUnknown, true),
          isNull(interventionSpecies.scientificSpeciesId)
        )
      );

    // Process known species aggregation
    const knownSpeciesMap = new Map<number, KnownSpeciesResponse>();
    
    for (const row of knownSpeciesQuery) {
      const scientificSpeciesId = row.scientificSpeciesId;
      
      if (!knownSpeciesMap.has(scientificSpeciesId)) {
        // Initialize aggregated record
        knownSpeciesMap.set(scientificSpeciesId, {
          scientificSpeciesId,
          scientificName: row.scientificName,
          commonName: row.commonName,
          speciesName: row.speciesName,
          image: row.projectSpeciesImage || null,
          
          isInProjectSpecies: !!row.projectSpeciesId,
          isFavourite: row.isFavourite,
          projectSpeciesNotes: row.projectSpeciesNotes,
          
          interventionUsageCount: 0,
          totalSpecimenCount: 0,
          interventionIds: [],
          createdAt: row.projectSpeciesCreatedAt || row.interventionSpeciesCreatedAt,
          updatedAt: row.projectSpeciesUpdatedAt || row.interventionSpeciesUpdatedAt,
        });
      }
      
      const species = knownSpeciesMap.get(scientificSpeciesId)!;
      
      // Update project species data if exists
      if (row.projectSpeciesId && !species.isInProjectSpecies) {
        species.isInProjectSpecies = true;
        species.isFavourite = row.isFavourite;
        species.projectSpeciesNotes = row.projectSpeciesNotes;
        species.image = species.image || row.projectSpeciesImage;
      }
      
      // Aggregate intervention data
      if (row.interventionSpeciesId && row.interventionId) {
        if (!species.interventionIds.includes(row.interventionId)) {
          species.interventionIds.push(row.interventionId);
          species.interventionUsageCount++;
        }
        species.totalSpecimenCount += row.speciesCount || 0;
      }
    }

    const knownSpecies = Array.from(knownSpeciesMap.values());
    const unknownSpecies: UnknownSpeciesResponse[] = unknownSpeciesQuery.map(row => ({
      uid: row.uid,
      speciesName: '',
      commonName: row.speciesName,
      interventionId: row.interventionId,
      interventionUid: row.interventionUid,
      interventionHid: row.interventionHid,
      speciesCount: row.speciesCount,
      image: row.image,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    // Calculate summary
    const totalProjectSpecies = knownSpecies.filter(s => s.isInProjectSpecies).length;
    const totalInterventionSpecies = knownSpecies.filter(s => s.interventionUsageCount > 0).length + unknownSpecies.length;

    return {
      knownSpecies,
      unknownSpecies,
      summary: {
        totalKnownSpecies: knownSpecies.length,
        totalUnknownSpecies: unknownSpecies.length,
        totalProjectSpecies,
        totalInterventionSpecies,
      },
    };
  }

  async updateFavourite(
    speciesId: string,
    membership: ProjectGuardResponse,
    updateDto: { fav: boolean },
  ) {
    const existingSpecies = await this.getByUid(speciesId, membership.projectId);
    if (!existingSpecies) {
      throw new NotFoundException('User species not found');
    }

    const updatedSpecies = await this.drizzle.db
      .update(projectSpecies)
      .set({
        favourite: updateDto.fav,
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
    return false
  }

  async updateDisbale(
    speciesId: string,
    membership: ProjectGuardResponse,
    updateDto: { disable: boolean },
  ) {
    try {
      const existingSpecies = await this.getByUid(speciesId, membership.projectId);
      if (!existingSpecies) {
        throw new NotFoundException('User species not found');
      }

      const updatedSpecies = await this.drizzle.db
        .update(projectSpecies)
        .set({
          isDisabled: updateDto.disable,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectSpecies.id, existingSpecies.id),
            eq(projectSpecies.projectId, membership.projectId),
          ),
        )
        .returning();
      console.log("SDC", updatedSpecies)

      if (!updatedSpecies.length) {
        throw new NotFoundException('User species not found');
      }
      return false
    } catch (error) {
      console.log("SDC", error)
    }
  }


  async getByUid(uid: string, projectId: number) {
    const species = await this.drizzle.db
      .select({
        id: projectSpecies.id,
        uid: projectSpecies.uid,
        commonName: projectSpecies.commonName,
        image: projectSpecies.image,
        description: projectSpecies.notes,
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







  //   async delete(speciesId: string, membership: ProjectGuardResponse) {
  //     const existingSpecies = await this.getByUid(speciesId, membership.projectId);

  //     if (!existingSpecies) {
  //       throw new BadRequestException('Species does not have an image to delete');
  //     }

  //     const deletedSpecies = await this.drizzle.db
  //       .delete(projectSpecies)
  //       .where(
  //         and(
  //           eq(projectSpecies.id, existingSpecies.id),
  //           eq(projectSpecies.projectId, membership.projectId),
  //         ),
  //       )
  //       .returning();

  //     if (!deletedSpecies.length) {
  //       throw new NotFoundException('User species not found');
  //     }
  //     return { message: 'Species deleted successfully' };
  //   }





  //   // async getById(id: number, userId: number, projectId: number) {
  //   //   const species = await this.drizzle.db
  //   //     .select({
  //   //       id: userSpecies.id,
  //   //       uid: userSpecies.uid,
  //   //       aliases: userSpecies.aliases,
  //   //       localName: userSpecies.localName,
  //   //       image: userSpecies.image,
  //   //       description: userSpecies.description,
  //   //       notes: userSpecies.notes,
  //   //       favourite: userSpecies.favourite,
  //   //       createdAt: userSpecies.createdAt,
  //   //       updatedAt: userSpecies.updatedAt,
  //   //       scientificSpecies: {
  //   //         id: scientificSpecies.id,
  //   //         uid: scientificSpecies.uid,
  //   //         scientificName: scientificSpecies.scientificName,
  //   //         commonName: scientificSpecies.commonName,
  //   //         description: scientificSpecies.description,
  //   //         image: scientificSpecies.image,
  //   //         gbifId: scientificSpecies.gbifId,
  //   //       },
  //   //     })
  //   //     .from(userSpecies)
  //   //     .leftJoin(scientificSpecies, eq(userSpecies.scientificSpeciesId, scientificSpecies.id))
  //   //     .where(
  //   //       and(
  //   //         eq(userSpecies.id, id),
  //   //         eq(userSpecies.userId, userId),
  //   //         eq(userSpecies.projectId, projectId),
  //   //       ),
  //   //     )
  //   //     .limit(1);

  //   //   if (!species.length) {
  //   //     throw new NotFoundException('User species not found');
  //   //   }

  //   //   return species[0];
  //   // }

  //   // async getAll(userId: number, projectId: number, filterDto: UserSpeciesFilterDto) {
  //   //   const { page = 1, limit = 10, search, favouriteOnly } = filterDto;
  //   //   const offset = (page - 1) * limit;

  //   //   let whereConditions = [
  //   //     eq(userSpecies.userId, userId),
  //   //     eq(userSpecies.projectId, projectId),
  //   //   ];

  //   //   if (favouriteOnly) {
  //   //     whereConditions.push(eq(userSpecies.favourite, true));
  //   //   }

  //   //   if (search) {
  //   //     whereConditions.push(
  //   //       or(
  //   //         ilike(userSpecies.localName, `%${search}%`),
  //   //         ilike(scientificSpecies.scientificName, `%${search}%`),
  //   //         ilike(scientificSpecies.commonName, `%${search}%`),
  //   //       ),
  //   //     );
  //   //   }

  //   //   const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  //   //   const [data, totalResult, totalSpeciesResult, totalFavouriteResult] = await Promise.all([
  //   //     this.drizzle.db
  //   //       .select({
  //   //         id: userSpecies.id,
  //   //         uid: userSpecies.uid,
  //   //         aliases: userSpecies.aliases,
  //   //         localName: userSpecies.localName,
  //   //         image: userSpecies.image,
  //   //         description: userSpecies.description,
  //   //         notes: userSpecies.notes,
  //   //         favourite: userSpecies.favourite,
  //   //         createdAt: userSpecies.createdAt,
  //   //         updatedAt: userSpecies.updatedAt,
  //   //         scientificSpecies: {
  //   //           id: scientificSpecies.id,
  //   //           uid: scientificSpecies.uid,
  //   //           scientificName: scientificSpecies.scientificName,
  //   //           commonName: scientificSpecies.commonName,
  //   //           description: scientificSpecies.description,
  //   //           image: scientificSpecies.image,
  //   //           gbifId: scientificSpecies.gbifId,
  //   //         },
  //   //       })
  //   //       .from(userSpecies)
  //   //       .leftJoin(scientificSpecies, eq(userSpecies.scientificSpeciesId, scientificSpecies.id))
  //   //       .where(whereClause ? whereClause : sql`TRUE`)
  //   //       .orderBy(desc(userSpecies.createdAt))
  //   //       .limit(limit)
  //   //       .offset(offset),

  //   //     this.drizzle.db
  //   //       .select({ count: sql<number>`count(*)` })
  //   //       .from(userSpecies)
  //   //       .leftJoin(scientificSpecies, eq(userSpecies.scientificSpeciesId, scientificSpecies.id))
  //   //       .where(whereClause ? whereClause : sql`TRUE`),

  //   //     this.drizzle.db
  //   //       .select({ count: sql<number>`count(*)` })
  //   //       .from(userSpecies)
  //   //       .where(and(eq(userSpecies.userId, userId), eq(userSpecies.projectId, projectId))),

  //   //     this.drizzle.db
  //   //       .select({ count: sql<number>`count(*)` })
  //   //       .from(userSpecies)
  //   //       .where(
  //   //         and(
  //   //           eq(userSpecies.userId, userId),
  //   //           eq(userSpecies.projectId, projectId),
  //   //           eq(userSpecies.favourite, true),
  //   //         ),
  //   //       ),
  //   //   ]);

  //   //   const total = totalResult[0]?.count || 0;
  //   //   const totalSpecies = totalSpeciesResult[0]?.count || 0;
  //   //   const totalFavouriteSpecies = totalFavouriteResult[0]?.count || 0;

  //   //   return {
  //   //     data,
  //   //     total,
  //   //     page,
  //   //     limit,
  //   //     totalPages: Math.ceil(total / limit),
  //   //     totalSpecies,
  //   //     totalFavouriteSpecies,
  //   //   };
  //   // }

  //   // async getById(id: number, userId: number, projectId: number) {
  //   //   const species = await this.drizzle.db
  //   //     .select({
  //   //       id: userSpecies.id,
  //   //       uid: userSpecies.uid,
  //   //       aliases: userSpecies.aliases,
  //   //       localName: userSpecies.localName,
  //   //       image: userSpecies.image,
  //   //       description: userSpecies.description,
  //   //       notes: userSpecies.notes,
  //   //       favourite: userSpecies.favourite,
  //   //       createdAt: userSpecies.createdAt,
  //   //       updatedAt: userSpecies.updatedAt,
  //   //       scientificSpecies: {
  //   //         id: scientificSpecies.id,
  //   //         uid: scientificSpecies.uid,
  //   //         scientificName: scientificSpecies.scientificName,
  //   //         commonName: scientificSpecies.commonName,
  //   //         description: scientificSpecies.description,
  //   //         image: scientificSpecies.image,
  //   //         gbifId: scientificSpecies.gbifId,
  //   //       },
  //   //     })
  //   //     .from(userSpecies)
  //   //     .leftJoin(scientificSpecies, eq(userSpecies.scientificSpeciesId, scientificSpecies.id))
  //   //     .where(
  //   //       and(
  //   //         eq(userSpecies.id, id),
  //   //         eq(userSpecies.userId, userId),
  //   //         eq(userSpecies.projectId, projectId),
  //   //       ),
  //   //     )
  //   //     .limit(1);

  //   //   if (!species.length) {
  //   //     throw new NotFoundException('User species not found');
  //   //   }

  //   //   return species[0];
  //   // }

  //   // async update(
  //   //   id: number,
  //   //   userId: number,
  //   //   projectId: number,
  //   //   updateDto: UpdateUserSpeciesDto,
  //   //   imageFile?: Express.Multer.File,
  //   // ) {
  //   //   const existingSpecies = await this.getById(id, userId, projectId);

  //   //   let imageUrl = existingSpecies.image;

  //   //   if (imageFile) {
  //   //     // Delete old image if exists
  //   //     if (existingSpecies.image) {
  //   //       try {
  //   //         await this.awsS3Service.deleteImage(existingSpecies.image);
  //   //       } catch (error) {
  //   //         console.warn('Failed to delete old image:', error);
  //   //       }
  //   //     }
  //   //     imageUrl = await this.awsS3Service.uploadImage(imageFile, 'user-species');
  //   //   }

  //   //   const updatedSpecies = await this.drizzle.db
  //   //     .update(userSpecies)
  //   //     .set({
  //   //       ...updateDto,
  //   //       image: imageUrl,
  //   //       updatedAt: new Date(),
  //   //     })
  //   //     .where(
  //   //       and(
  //   //         eq(userSpecies.id, id),
  //   //         eq(userSpecies.userId, userId),
  //   //         eq(userSpecies.projectId, projectId),
  //   //       ),
  //   //     )
  //   //     .returning();

  //   //   if (!updatedSpecies.length) {
  //   //     throw new NotFoundException('User species not found');
  //   //   }

  //   //   return this.getById(id, userId, projectId);
  //   // }

  //   // async updateFavourite(id: number, userId: number, projectId: number, favourite: boolean) {
  //   //   const updatedSpecies = await this.drizzle.db
  //   //     .update(userSpecies)
  //   //     .set({
  //   //       favourite,
  //   //       updatedAt: new Date(),
  //   //     })
  //   //     .where(
  //   //       and(
  //   //         eq(userSpecies.id, id),
  //   //         eq(userSpecies.userId, userId),
  //   //         eq(userSpecies.projectId, projectId),
  //   //       ),
  //   //     )
  //   //     .returning();

  //   //   if (!updatedSpecies.length) {
  //   //     throw new NotFoundException('User species not found');
  //   //   }

  //   //   return this.getById(id, userId, projectId);
  //   // }

  //   // async delete(id: number, userId: number, projectId: number) {
  //   //   const existingSpecies = await this.getById(id, userId, projectId);

  //   //   // Delete image from S3 if exists
  //   //   if (existingSpecies.image) {
  //   //     try {
  //   //       await this.awsS3Service.deleteImage(existingSpecies.image);
  //   //     } catch (error) {
  //   //       console.warn('Failed to delete image from S3:', error);
  //   //     }
  //   //   }

  //   //   const deletedSpecies = await this.drizzle.db
  //   //     .delete(userSpecies)
  //   //     .where(
  //   //       and(
  //   //         eq(userSpecies.id, id),
  //   //         eq(userSpecies.userId, userId),
  //   //         eq(userSpecies.projectId, projectId),
  //   //       ),
  //   //     )
  //   //     .returning();

  //   //   if (!deletedSpecies.length) {
  //   //     throw new NotFoundException('User species not found');
  //   //   }

  //   //   return { message: 'Species deleted successfully' };
  //   // }
}
