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
        isDisabled: createDto.isNativeSpecies || false,
        notes: createDto.description,
        favourite: createDto.favourite || false,
        image: createDto.image || ''
      })
      .returning();
    return newUserSpecies[0];
  }

  async getAll(membership: ProjectGuardResponse): Promise<{
    scientificSpecies: any[];
    unknownSpecies: any[];
    summary: {
      totalProjectSpecies: number;
      totalInterventionSpecies: number;
      totalUnknownSpecies: number;
      totalUniqueSpecies: number;
    };
  }> {
    try {
      // Get all data in parallel for better performance
      const [projectSpeciesData, interventionSpeciesData, interventionSummaryData] = await Promise.all([
        this.getProjectSpecies(membership.projectId, membership.userId),
        this.getInterventionSpecies(membership.projectId),
        this.getInterventionSpeciesSummary(membership.projectId)
      ]);

      // Process and aggregate the data
      const { scientificSpecies, unknownSpecies } = this.aggregateSpeciesData(
        projectSpeciesData,
        interventionSpeciesData,
        interventionSummaryData
      );

      // Calculate summary statistics
      const summary = {
        totalProjectSpecies: projectSpeciesData.length,
        totalInterventionSpecies: interventionSummaryData.filter(s => !s.isUnknown).length,
        totalUnknownSpecies: unknownSpecies.length,
        totalUniqueSpecies: scientificSpecies.length + unknownSpecies.length,
      };

      return {
        scientificSpecies,
        unknownSpecies,
        summary,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch species data: ${error.message}`);
    }
  }

  private async getProjectSpecies(projectId: number,userId:number) {
    return this.drizzle.db
      .select({
        // Project species fields
        uid: projectSpecies.uid,
        scientificSpeciesId: projectSpecies.scientificSpeciesId,
        isUnknown: projectSpecies.isUnknown,
        speciesName: projectSpecies.speciesName,
        commonName: projectSpecies.commonName,
        image: projectSpecies.image,
        notes: projectSpecies.notes,
        favourite: projectSpecies.favourite,
        isDisabled: projectSpecies.isDisabled,
        createdAt: projectSpecies.createdAt,
        updatedAt: projectSpecies.updatedAt,
        addedByUid: user.uid,
        addedByName: user.displayName,
        addedByImage: user.image,
      })
      .from(projectSpecies)
      .leftJoin(scientificSpecies, eq(projectSpecies.scientificSpeciesId, scientificSpecies.id))
      .leftJoin(user, eq(projectSpecies.addedById, userId))
      .where(
        and(
          eq(projectSpecies.projectId, projectId),
          isNull(projectSpecies.deletedAt)
        )
      )
      .orderBy(desc(projectSpecies.createdAt));
  }

  private async getInterventionSpecies(projectId: number) {
    return this.drizzle.db
      .select({
        interventionSpeciesUid: interventionSpecies.uid,
        interventionId: interventionSpecies.interventionId,
        scientificSpeciesId: interventionSpecies.scientificSpeciesId,
        isUnknown: interventionSpecies.isUnknown,
        speciesName: interventionSpecies.speciesName,
        speciesCount: interventionSpecies.speciesCount,
        interventionSpeciesCreatedAt: interventionSpecies.createdAt,
        scientificSpeciesUid: scientificSpecies.uid,
        scientificName: scientificSpecies.scientificName,
        commonName: scientificSpecies.commonName,
        description: scientificSpecies.description,
        image: scientificSpecies.image,
        family: scientificSpecies.family,
        genus: scientificSpecies.genus,
        conservationStatus: scientificSpecies.conservationStatus,
        isNative: scientificSpecies.isNative,
        isInvasive: scientificSpecies.isInvasive,

        // Intervention context
        interventionUid: intervention.uid,
        interventionHid: intervention.hid,
        interventionType: intervention.type,
        interventionStartDate: intervention.interventionStartDate,
        interventionCreatedAt: intervention.createdAt,
      })
      .from(interventionSpecies)
      .leftJoin(scientificSpecies, eq(interventionSpecies.scientificSpeciesId, scientificSpecies.id))
      .leftJoin(intervention, eq(interventionSpecies.interventionId, intervention.id))
      .where(
        and(
          eq(intervention.projectId, projectId),
          isNull(intervention.deletedAt)
        )
      )
      .orderBy(desc(interventionSpecies.createdAt));
  }

  private async getInterventionSpeciesSummary(projectId: number) {
    // Get aggregated intervention species data for summary counts
    return this.drizzle.db
      .select({
        scientificSpeciesId: interventionSpecies.scientificSpeciesId,
        scientificSpeciesUid: scientificSpecies.uid,
        speciesName: interventionSpecies.speciesName,
        isUnknown: interventionSpecies.isUnknown,
        totalCount: sql<number>`sum(${interventionSpecies.speciesCount})::int`,
        interventionCount: sql<number>`count(distinct ${interventionSpecies.interventionId})::int`,
        interventionTypes: sql<string[]>`array_agg(distinct ${intervention.type})`,
        firstUsedAt: sql<Date>`min(${intervention.interventionStartDate})`,
        lastUsedAt: sql<Date>`max(${intervention.interventionStartDate})`,
      })
      .from(interventionSpecies)
      .leftJoin(scientificSpecies, eq(interventionSpecies.scientificSpeciesId, scientificSpecies.id))
      .leftJoin(intervention, eq(interventionSpecies.interventionId, intervention.id))
      .where(
        and(
          eq(intervention.projectId, projectId),
          isNull(intervention.deletedAt)
        )
      )
      .groupBy(
        interventionSpecies.scientificSpeciesId,
        scientificSpecies.uid,
        interventionSpecies.speciesName,
        interventionSpecies.isUnknown
      );
  }

  private aggregateSpeciesData(
    projectSpeciesData: any[],
    interventionSpeciesData: any[],
    interventionSummaryData: any[]
  ) {
    const scientificSpeciesMap = new Map<string, any>();
    const unknownSpeciesMap = new Map<string, any>();

    // Process project species first
    projectSpeciesData.forEach(projectSpecies => {
      if (projectSpecies.isUnknown) {
        // Handle unknown project species
        const key = `custom_${projectSpecies.customSpeciesName}`;
        unknownSpeciesMap.set(key, {
          uid: projectSpecies.uid,
          type: 'custom',
          speciesName: projectSpecies.customSpeciesName,
          commonName: projectSpecies.customCommonName,
          image: projectSpecies.customImage || projectSpecies.image,
          description: null,
          notes: projectSpecies.notes,
          isUnknown: true,
          favourite: projectSpecies.favourite,
          isDisabled: projectSpecies.isDisabled,
          priority: projectSpecies.priority,
          plannedQuantity: projectSpecies.plannedQuantity,
          actualQuantity: projectSpecies.actualQuantity,
          sources: ['project'],
          sourceDetails: {
            project: {
              addedBy: {
                uid: projectSpecies.addedByUid,
                name: projectSpecies.addedByName,
                image: projectSpecies.addedByImage,
              },
              addedAt: projectSpecies.createdAt,
            }
          },
          interventionUsage: {
            totalCount: 0,
            interventionCount: 0,
            interventionTypes: [],
            firstUsedAt: null,
            lastUsedAt: null,
          },
          createdAt: projectSpecies.createdAt,
          updatedAt: projectSpecies.updatedAt,
        });
      } else if (projectSpecies.scientificSpeciesId) {
        // Handle known scientific species from project
        const key = projectSpecies.scientificSpeciesUid || `scientific_${projectSpecies.scientificSpeciesId}`;
        scientificSpeciesMap.set(key, {
          uid: projectSpecies.uid,
          scientificSpeciesId: projectSpecies.scientificSpeciesId,
          scientificSpeciesUid: projectSpecies.scientificSpeciesUid,
          speciesName: projectSpecies.scientificName,
          commonName: projectSpecies.commonName,
          description: projectSpecies.description,
          image: projectSpecies.image,
          family: projectSpecies.family,
          genus: projectSpecies.genus,
          species: projectSpecies.species,
          conservationStatus: projectSpecies.conservationStatus,
          isNative: projectSpecies.isNative,
          isInvasive: projectSpecies.isInvasive,
          isUnknown: false,
          favourite: projectSpecies.favourite,
          isDisabled: projectSpecies.isDisabled,
          priority: projectSpecies.priority,
          plannedQuantity: projectSpecies.plannedQuantity,
          actualQuantity: projectSpecies.actualQuantity,
          notes: projectSpecies.notes,
          sources: ['project'],
          sourceDetails: {
            project: {
              addedBy: {
                uid: projectSpecies.addedByUid,
                name: projectSpecies.addedByName,
                image: projectSpecies.addedByImage,
              },
              addedAt: projectSpecies.createdAt,
            }
          },
          interventionUsage: {
            totalCount: 0,
            interventionCount: 0,
            interventionTypes: [],
            firstUsedAt: null,
            lastUsedAt: null,
          },
          createdAt: projectSpecies.createdAt,
          updatedAt: projectSpecies.updatedAt,
        });
      }
    });

    // Process intervention species summary
    interventionSummaryData.forEach(summary => {
      if (summary.isUnknown) {
        // Handle unknown intervention species
        const key = `intervention_${summary.speciesName}`;
        if (!unknownSpeciesMap.has(key)) {
          unknownSpeciesMap.set(key, {
            uid: `intervention_${summary.speciesName}_${Date.now()}`,
            type: 'intervention_unknown',
            speciesName: summary.speciesName,
            commonName: null,
            image: '',
            description: null,
            notes: null,
            isUnknown: true,
            favourite: false,
            isDisabled: false,
            priority: null,
            plannedQuantity: null,
            actualQuantity: null,
            sources: ['intervention'],
            sourceDetails: {},
            interventionUsage: {
              totalCount: summary.totalCount,
              interventionCount: summary.interventionCount,
              interventionTypes: summary.interventionTypes,
              firstUsedAt: summary.firstUsedAt,
              lastUsedAt: summary.lastUsedAt,
            },
            createdAt: summary.firstUsedAt,
            updatedAt: summary.lastUsedAt,
          });
        } else {
          // Update existing unknown species with intervention data
          const existing = unknownSpeciesMap.get(key);
          if (!existing.sources.includes('intervention')) {
            existing.sources.push('intervention');
          }
          existing.interventionUsage = {
            totalCount: summary.totalCount,
            interventionCount: summary.interventionCount,
            interventionTypes: summary.interventionTypes,
            firstUsedAt: summary.firstUsedAt,
            lastUsedAt: summary.lastUsedAt,
          };
        }
      } else {
        // Handle known scientific species from interventions
        const key = summary.scientificSpeciesUid || `scientific_${summary.scientificSpeciesId}`;

        if (scientificSpeciesMap.has(key)) {
          // Update existing scientific species with intervention data
          const existing = scientificSpeciesMap.get(key);
          if (!existing.sources.includes('intervention')) {
            existing.sources.push('intervention');
          }
          existing.interventionUsage = {
            totalCount: summary.totalCount,
            interventionCount: summary.interventionCount,
            interventionTypes: summary.interventionTypes,
            firstUsedAt: summary.firstUsedAt,
            lastUsedAt: summary.lastUsedAt,
          };
        } else {
          // Create new entry for intervention-only scientific species
          // Get the first intervention species record for this scientific species
          const interventionSpecies = interventionSpeciesData.find(
            item => item.scientificSpeciesId === summary.scientificSpeciesId && !item.isUnknown
          );

          if (interventionSpecies) {
            scientificSpeciesMap.set(key, {
              uid: `intervention_scientific_${summary.scientificSpeciesId}`,
              scientificSpeciesId: summary.scientificSpeciesId,
              scientificSpeciesUid: summary.scientificSpeciesUid,
              speciesName: interventionSpecies.scientificName || summary.speciesName,
              commonName: interventionSpecies.commonName,
              description: interventionSpecies.description,
              image: interventionSpecies.image,
              family: interventionSpecies.family,
              genus: interventionSpecies.genus,
              conservationStatus: interventionSpecies.conservationStatus,
              isNative: interventionSpecies.isNative,
              isInvasive: interventionSpecies.isInvasive,
              isUnknown: false,
              favourite: false,
              isDisabled: false,
              priority: null,
              plannedQuantity: null,
              actualQuantity: null,
              notes: null,
              sources: ['intervention'],
              sourceDetails: {},
              interventionUsage: {
                totalCount: summary.totalCount,
                interventionCount: summary.interventionCount,
                interventionTypes: summary.interventionTypes,
                firstUsedAt: summary.firstUsedAt,
                lastUsedAt: summary.lastUsedAt,
              },
              createdAt: summary.firstUsedAt,
              updatedAt: summary.lastUsedAt,
            });
          }
        }
      }
    });

    return {
      scientificSpecies: Array.from(scientificSpeciesMap.values())
        .sort((a, b) => {
          // Sort by: favourites first, then by usage in interventions, then by creation date
          if (a.favourite !== b.favourite) return b.favourite ? 1 : -1;
          if (a.interventionUsage.totalCount !== b.interventionUsage.totalCount) {
            return b.interventionUsage.totalCount - a.interventionUsage.totalCount;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }),
      unknownSpecies: Array.from(unknownSpeciesMap.values())
        .sort((a, b) => {
          // Sort by usage count first, then by creation date
          if (a.interventionUsage.totalCount !== b.interventionUsage.totalCount) {
            return b.interventionUsage.totalCount - a.interventionUsage.totalCount;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }),
    };
  }

  // Additional helper method to get species by filter
  async getSpeciesByFilter(
    membership: ProjectGuardResponse,
    filters: {
      source?: 'project' | 'intervention' | 'both';
      isUnknown?: boolean;
      favourite?: boolean;
      isDisabled?: boolean;
      priority?: string;
      search?: string;
    } = {}
  ) {
    const allSpecies = await this.getAll(membership);

    let filteredScientific = allSpecies.scientificSpecies;
    let filteredUnknown = allSpecies.unknownSpecies;

    // Apply filters
    if (filters.source) {
      const sourceFilter = (species: any) => {
        if (filters.source === 'both') return species.sources.length > 1;
        return species.sources.includes(filters.source);
      };
      filteredScientific = filteredScientific.filter(sourceFilter);
      filteredUnknown = filteredUnknown.filter(sourceFilter);
    }

    if (filters.isUnknown !== undefined) {
      if (filters.isUnknown) {
        filteredScientific = [];
      } else {
        filteredUnknown = [];
      }
    }

    if (filters.favourite !== undefined) {
      filteredScientific = filteredScientific.filter(s => s.favourite === filters.favourite);
      filteredUnknown = filteredUnknown.filter(s => s.favourite === filters.favourite);
    }

    if (filters.isDisabled !== undefined) {
      filteredScientific = filteredScientific.filter(s => s.isDisabled === filters.isDisabled);
      filteredUnknown = filteredUnknown.filter(s => s.isDisabled === filters.isDisabled);
    }

    if (filters.priority) {
      filteredScientific = filteredScientific.filter(s => s.priority === filters.priority);
      filteredUnknown = filteredUnknown.filter(s => s.priority === filters.priority);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchFilter = (species: any) =>
        species.speciesName?.toLowerCase().includes(searchLower) ||
        species.commonName?.toLowerCase().includes(searchLower) ||
        species.family?.toLowerCase().includes(searchLower) ||
        species.genus?.toLowerCase().includes(searchLower);

      filteredScientific = filteredScientific.filter(searchFilter);
      filteredUnknown = filteredUnknown.filter(searchFilter);
    }

    return {
      scientificSpecies: filteredScientific,
      unknownSpecies: filteredUnknown,
      summary: {
        ...allSpecies.summary,
        filteredScientificCount: filteredScientific.length,
        filteredUnknownCount: filteredUnknown.length,
      },
    };
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

  //   async getByUid(uid: string, projectId: number) {
  //     const species = await this.drizzle.db
  //       .select({
  //         id: projectSpecies.id,
  //         uid: projectSpecies.uid,
  //         commonName: projectSpecies.commonName,
  //         image: projectSpecies.image,
  //         description: projectSpecies.description,
  //         notes: projectSpecies.notes,
  //         favourite: projectSpecies.favourite,
  //         createdAt: projectSpecies.createdAt,
  //         updatedAt: projectSpecies.updatedAt,
  //         scientificSpecies: {
  //           id: scientificSpecies.id,
  //           uid: scientificSpecies.uid,
  //           scientificName: scientificSpecies.scientificName,
  //           commonName: scientificSpecies.commonName,
  //           description: scientificSpecies.description,
  //           gbifId: scientificSpecies.gbifId,
  //         },
  //       })
  //       .from(projectSpecies)
  //       .leftJoin(scientificSpecies, eq(projectSpecies.scientificSpeciesId, scientificSpecies.id))
  //       .where(
  //         and(
  //           eq(projectSpecies.uid, uid),
  //           eq(projectSpecies.projectId, projectId),
  //         ),
  //       )
  //       .limit(1);

  //     if (!species.length) {
  //       throw new NotFoundException('User species not found');
  //     }

  //     return species[0];
  //   }

  //   async update(
  //     speciesId: string,
  //     membership: ProjectGuardResponse,
  //     updateDto: UpdateUserSpeciesDto,
  //   ) {
  //     const existingSpecies = await this.getByUid(speciesId, membership.projectId);
  //     if (!existingSpecies) {
  //       throw new NotFoundException('User species not found');
  //     }

  //     const updatedSpecies = await this.drizzle.db
  //       .update(projectSpecies)
  //       .set({
  //         ...updateDto,
  //         updatedAt: new Date(),
  //       })
  //       .where(
  //         and(
  //           eq(projectSpecies.id, existingSpecies.id),
  //           eq(projectSpecies.projectId, membership.projectId),
  //         ),
  //       )
  //       .returning();

  //     if (!updatedSpecies.length) {
  //       throw new NotFoundException('User species not found');
  //     }

  //     return updatedSpecies[0]
  //   }

  //   async updateFavourite(
  //     speciesId: string,
  //     membership: ProjectGuardResponse,
  //     updateDto: { fav: boolean },
  //   ) {
  //     const existingSpecies = await this.getByUid(speciesId, membership.projectId);
  //     if (!existingSpecies) {
  //       throw new NotFoundException('User species not found');
  //     }

  //     const updatedSpecies = await this.drizzle.db
  //       .update(projectSpecies)
  //       .set({
  //         favourite: updateDto.fav,
  //         updatedAt: new Date(),
  //       })
  //       .where(
  //         and(
  //           eq(projectSpecies.id, existingSpecies.id),
  //           eq(projectSpecies.projectId, membership.projectId),
  //         ),
  //       )
  //       .returning();

  //     if (!updatedSpecies.length) {
  //       throw new NotFoundException('User species not found');
  //     }
  //     return false
  //   }

  //   async updateDisbale(
  //     speciesId: string,
  //     membership: ProjectGuardResponse,
  //     updateDto: { disable: boolean },
  //   ) {
  //     try {
  //       const existingSpecies = await this.getByUid(speciesId, membership.projectId);
  //       if (!existingSpecies) {
  //         throw new NotFoundException('User species not found');
  //       }

  //       const updatedSpecies = await this.drizzle.db
  //         .update(projectSpecies)
  //         .set({
  //           isDisabled: updateDto.disable,
  //           updatedAt: new Date(),
  //         })
  //         .where(
  //           and(
  //             eq(projectSpecies.id, existingSpecies.id),
  //             eq(projectSpecies.projectId, membership.projectId),
  //           ),
  //         )
  //         .returning();
  //       console.log("SDC", updatedSpecies)

  //       if (!updatedSpecies.length) {
  //         throw new NotFoundException('User species not found');
  //       }
  //       return false
  //     } catch (error) {
  //       console.log("SDC", error)
  //     }
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
