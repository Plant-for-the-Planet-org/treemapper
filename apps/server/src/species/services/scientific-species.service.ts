import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { DrizzleService } from '../../database/drizzle.service';
import { scientificSpecies } from '../../database/schema/index';
import { BulkUploadScientificSpeciesDto, ScientificSpeciesFilterDto } from './../dto/scientific-species.dto';
import { eq, ilike, or, desc, asc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ScientificSpeciesService {
  constructor(private readonly drizzle: DrizzleService) { }

  async bulkUpload(bulkUploadDto: BulkUploadScientificSpeciesDto) {
    const { species } = bulkUploadDto;

    // Start with very small batches to test
    const batchSize = 2000; // Much smaller
    for (let i = 0; i < species.length; i += batchSize) {
      const batch = species.slice(i, i + batchSize);

      try {
        const result = await this.drizzle.db.transaction(async (tx) => {
          const batchData = batch.map(speciesData => ({
            uid: speciesData.guid,
            scientificName: speciesData.scientific_name,
          }));

          return await tx
            .insert(scientificSpecies)
            .values(batchData)
            .returning();
        });

        console.log(`Processed batch ${i / batchSize + 1}, inserted ${result.length} records`);

      } catch (error) {
        console.error(`Error in batch ${i / batchSize + 1}:`, error);
        throw error;
      }
    }

    return {
      message: `Successfully uploaded`,
    };
  }
  async getAll(filterDto: ScientificSpeciesFilterDto) {
    const { page = 1, limit = 10, search } = filterDto;
    const offset = (page - 1) * limit;

    let whereCondition;
    if (search) {
      whereCondition = or(
        ilike(scientificSpecies.scientificName, `%${search}%`),
        ilike(scientificSpecies.commonName, `%${search}%`),
      );
    }

    const [data, totalResult] = await Promise.all([
      this.drizzle.db
        .select()
        .from(scientificSpecies)
        .where(whereCondition)
        .orderBy(desc(scientificSpecies.createdAt))
        .limit(limit)
        .offset(offset),

      this.drizzle.db
        .select({ count: sql<number>`count(*)` })
        .from(scientificSpecies)
        .where(whereCondition),
    ]);

    const total = totalResult[0]?.count || 0;

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchSpecies(searchTerm: string, limit: number = 10) {
    try {
      // Trim and validate search term
      const trimmedSearch = searchTerm.trim();

      if (!trimmedSearch) {
        return {
          success: false,
          message: 'Search term cannot be empty',
          data: [],
          count: 0,
        };
      }

      const species = await this.drizzle.db
        .select({
          id: scientificSpecies.id,
          uid: scientificSpecies.uid,
          scientificName: scientificSpecies.scientificName,
          commonName: scientificSpecies.commonName,
          description: scientificSpecies.description,
        })
        .from(scientificSpecies)
        .where(ilike(scientificSpecies.scientificName, `%${trimmedSearch}%`))
        .orderBy(asc(scientificSpecies.scientificName))
        .limit(limit);

      return species;
    } catch (error) {
      console.error('Error searching species:', error);
      throw new Error('Failed to search species');
    }
  }

}