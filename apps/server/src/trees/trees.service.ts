// // src/modules/trees/trees.service.ts
// import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
// import { and, eq, desc, asc, gte, lte, inArray, sql, count, avg } from 'drizzle-orm';
// import { 
//   interventions, 
//   scientificSpecies,
//   users
// } from '../database/schema'
// import { 
//   CreateTreeDto, 
//   UpdateTreeDto, 
//   QueryTreeDto,
//   CreateTreeRecordDto,
//   UpdateTreeRecordDto,
//   TreeResponseDto,
//   TreeRecordResponseDto,
//   BulkTreeImportResultDto,
//   TreeStatsDto
// } from './dto/trees.dto';
// import * as XLSX from 'xlsx';
// import { DrizzleService } from 'src/database/drizzle.service';

// @Injectable()
// export class TreesService {
//     constructor(
//       private drizzleService: DrizzleService,
//     ) { }

//   async create(createTreeDto: CreateTreeDto, userId: number): Promise<Boolean> {
//     return true; // Placeholder for actual implementation
//     // Validate intervention exists and user has access
//     // const intervention = await this.db
//     //   .select()
//     //   .from(interventions)
//     //   .where(and(
//     //     eq(interventions.id, createTreeDto.interventionId),
//     //     sql`${interventions.deletedAt} IS NULL`
//     //   ))
//     //   .limit(1);

//     // if (intervention.length === 0) {
//     //   throw new NotFoundException('Intervention not found');
//     // }

//     // // Validate species exists if provided
//     // if (createTreeDto.scientificSpeciesId) {
//     //   const species = await this.db
//     //     .select()
//     //     .from(scientificSpecies)
//     //     .where(eq(scientificSpecies.id, createTreeDto.scientificSpeciesId))
//     //     .limit(1);

//     //   if (species.length === 0) {
//     //     throw new NotFoundException('Species not found');
//     //   }
//     // }

//     // // Validate intervention species if provided
//     // if (createTreeDto.interventionSpeciesId) {
//     //   const interventionSpeciesRecord = await this.db
//     //     .select()
//     //     .from(interventionSpecies)
//     //     .where(and(
//     //       eq(interventionSpecies.id, createTreeDto.interventionSpeciesId),
//     //       eq(interventionSpecies.interventionId, createTreeDto.interventionId),
//     //       sql`${interventionSpecies.deletedAt} IS NULL`
//     //     ))
//     //     .limit(1);

//     //   if (interventionSpeciesRecord.length === 0) {
//     //     throw new NotFoundException('Intervention species not found');
//     //   }
//     // }

//     // return await this.db.transaction(async (tx) => {
//     //   // Generate UID
//     //   const uid = this.generateUID();

//     //   // Create tree
//     //   const [newTree] = await tx
//     //     .insert(trees)
//     //     .values({
//     //       uid,
//     //       interventionId: createTreeDto.interventionId,
//     //       scientificSpeciesId: createTreeDto.scientificSpeciesId,
//     //       interventionSpeciesId: createTreeDto.interventionSpeciesId,
//     //       createdById: userId,
//     //       tag: createTreeDto.tag,
//     //       type: createTreeDto.type,
//     //       latitude: createTreeDto.latitude,
//     //       longitude: createTreeDto.longitude,
//     //       altitude: createTreeDto.altitude ? createTreeDto.altitude.toString() : null,
//     //       accuracy: createTreeDto.accuracy ? createTreeDto.accuracy.toString() : null,
//     //       currentHeight: createTreeDto.currentHeight,
//     //       currentDiameter: createTreeDto.currentDiameter,
//     //       status: createTreeDto.status,
//     //       plantingDate: createTreeDto.plantingDate ? new Date(createTreeDto.plantingDate) : null,
//     //       allImages: createTreeDto.allImages,
//     //       image: createTreeDto.image,
//     //       imageCdn: createTreeDto.imageCdn,
//     //       metadata: createTreeDto.metadata,
//     //     })
//     //     .returning();

//     //   // Create initial tree record if measurements provided
//     //   if (createTreeDto.currentHeight || createTreeDto.currentDiameter) {
//     //     await tx.insert(treeRecords).values({
//     //       uid: this.generateUID(),
//     //       treeId: newTree.id,
//     //       recordedById: userId,
//     //       height: createTreeDto.currentHeight,
//     //       diameter: createTreeDto.currentDiameter,
//     //       newStatus: createTreeDto.status,
//     //       recordType: 'initial',
//     //       notes: 'Initial tree registration',
//     //     });

//     //     // Update tree's last measurement date
//     //     await tx
//     //       .update(trees)
//     //       .set({ lastMeasurementDate: new Date() })
//     //       .where(eq(trees.id, newTree.id));
//     //   }

//     //   // Update intervention tree counts
//     //   await this.updateInterventionTreeCounts(tx, createTreeDto.interventionId);

//     //   return this.findOne(newTree.id);
//     // });
//   }

//   // async findAll(query: QueryTreeDto): Promise<{ data: TreeResponseDto[]; total: number; page: number; limit: number }> {
//   //   const { page, limit, ...filters } = query;
//   //   const offset = (page - 1) * limit;

//   //   // Build where conditions
//   //   const conditions = [];

//   //   if (filters.interventionId) {
//   //     conditions.push(eq(trees.interventionId, filters.interventionId));
//   //   }

//   //   if (filters.scientificSpeciesId) {
//   //     conditions.push(eq(trees.scientificSpeciesId, filters.scientificSpeciesId));
//   //   }

//   //   if (filters.status) {
//   //     conditions.push(eq(trees.status, filters.status));
//   //   }

//   //   if (filters.type) {
//   //     conditions.push(eq(trees.type, filters.type));
//   //   }

//   //   if (filters.plantingDateStart) {
//   //     conditions.push(gte(trees.plantingDate, new Date(filters.plantingDateStart)));
//   //   }

//   //   if (filters.plantingDateEnd) {
//   //     conditions.push(lte(trees.plantingDate, new Date(filters.plantingDateEnd)));
//   //   }

//   //   if (filters.search) {
//   //     conditions.push(
//   //       sql`${trees.tag} ILIKE ${'%' + filters.search + '%'}`
//   //     );
//   //   }

//   //   // Add deleted filter
//   //   conditions.push(sql`${trees.deletedAt} IS NULL`);

//   //   const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

//   //   // Get total count
//   //   const [{ total }] = await this.db
//   //     .select({ total: count() })
//   //     .from(trees)
//   //     .where(whereClause);

//   //   // Get data with sorting
//   //   const sortColumn = this.getSortColumn(filters.sortBy);
//   //   const sortDirection = filters.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

//   //   const data = await this.db
//   //     .select({
//   //       id: trees.id,
//   //       uid: trees.uid,
//   //       interventionId: trees.interventionId,
//   //       scientificSpeciesId: trees.scientificSpeciesId,
//   //       interventionSpeciesId: trees.interventionSpeciesId,
//   //       tag: trees.tag,
//   //       type: trees.type,
//   //       latitude: trees.latitude,
//   //       longitude: trees.longitude,
//   //       altitude: trees.altitude,
//   //       accuracy: trees.accuracy,
//   //       currentHeight: trees.currentHeight,
//   //       currentDiameter: trees.currentDiameter,
//   //       status: trees.status,
//   //       plantingDate: trees.plantingDate,
//   //       lastMeasurementDate: trees.lastMeasurementDate,
//   //       createdById: trees.createdById,
//   //       allImages: trees.allImages,
//   //       image: trees.image,
//   //       imageCdn: trees.imageCdn,
//   //       metadata: trees.metadata,
//   //       createdAt: trees.createdAt,
//   //       updatedAt: trees.updatedAt,
//   //       // Related data
//   //       interventionHid: interventions.hid,
//   //       scientificName: scientificSpecies.scientificName,
//   //       commonName: scientificSpecies.commonName,
//   //       createdByName: users.name,
//   //     })
//   //     .from(trees)
//   //     .leftJoin(interventions, eq(trees.interventionId, interventions.id))
//   //     .leftJoin(scientificSpecies, eq(trees.scientificSpeciesId, scientificSpecies.id))
//   //     .leftJoin(users, eq(trees.createdById, users.id))
//   //     .where(whereClause)
//   //     .orderBy(sortDirection)
//   //     .limit(limit)
//   //     .offset(offset);

//   //   // Get recent records for each tree
//   //   const treeIds = data.map(tree => tree.id);
//   //   const recentRecords = await this.getRecentTreeRecords(treeIds);

//   //   const formattedData = data.map(tree => ({
//   //     ...tree,
//   //     records: recentRecords[tree.id] || [],
//   //   }));

//   //   return {
//   //     data: formattedData as TreeResponseDto[],
//   //     total: Number(total),
//   //     page,
//   //     limit,
//   //   };
//   // }

//   // async findOne(id: number): Promise<TreeResponseDto> {
//   //   const data = await this.db
//   //     .select({
//   //       id: trees.id,
//   //       uid: trees.uid,
//   //       interventionId: trees.interventionId,
//   //       scientificSpeciesId: trees.scientificSpeciesId,
//   //       interventionSpeciesId: trees.interventionSpeciesId,
//   //       tag: trees.tag,
//   //       type: trees.type,
//   //       latitude: trees.latitude,
//   //       longitude: trees.longitude,
//   //       altitude: trees.altitude,
//   //       accuracy: trees.accuracy,
//   //       currentHeight: trees.currentHeight,
//   //       currentDiameter: trees.currentDiameter,
//   //       status: trees.status,
//   //       plantingDate: trees.plantingDate,
//   //       lastMeasurementDate: trees.lastMeasurementDate,
//   //       createdById: trees.createdById,
//   //       allImages: trees.allImages,
//   //       image: trees.image,
//   //       imageCdn: trees.imageCdn,
//   //       metadata: trees.metadata,
//   //       createdAt: trees.createdAt,
//   //       updatedAt: trees.updatedAt,
//   //       // Related data
//   //       interventionHid: interventions.hid,
//   //       scientificName: scientificSpecies.scientificName,
//   //       commonName: scientificSpecies.commonName,
//   //       createdByName: users.name,
//   //     })
//   //     .from(trees)
//   //     .leftJoin(interventions, eq(trees.interventionId, interventions.id))
//   //     .leftJoin(scientificSpecies, eq(trees.scientificSpeciesId, scientificSpecies.id))
//   //     .leftJoin(users, eq(trees.createdById, users.id))
//   //     .where(and(
//   //       eq(trees.id, id),
//   //       sql`${trees.deletedAt} IS NULL`
//   //     ))
//   //     .limit(1);

//   //   if (data.length === 0) {
//   //     throw new NotFoundException('Tree not found');
//   //   }

//   //   const tree = data[0];

//   //   // Get all records for this tree
//   //   const records = await this.getTreeRecords(id);

//   //   return {
//   //     ...tree,
//   //     records,
//   //   } as TreeResponseDto;
//   // }

//   // async update(id: number, updateTreeDto: UpdateTreeDto): Promise<TreeResponseDto> {
//   //   const existingTree = await this.db
//   //     .select()
//   //     .from(trees)
//   //     .where(and(
//   //       eq(trees.id, id),
//   //       sql`${trees.deletedAt} IS NULL`
//   //     ))
//   //     .limit(1);

//   //   if (existingTree.length === 0) {
//   //     throw new NotFoundException('Tree not found');
//   //   }

//   //   // Validate species if being updated
//   //   if (updateTreeDto.scientificSpeciesId && updateTreeDto.scientificSpeciesId !== existingTree[0].scientificSpeciesId) {
//   //     const species = await this.db
//   //       .select()
//   //       .from(scientificSpecies)
//   //       .where(eq(scientificSpecies.id, updateTreeDto.scientificSpeciesId))
//   //       .limit(1);

//   //     if (species.length === 0) {
//   //       throw new NotFoundException('Species not found');
//   //     }
//   //   }

//   //   const updateData: any = {
//   //     ...updateTreeDto,
//   //     updatedAt: new Date(),
//   //   };

//   //   // Handle date conversions
//   //   if (updateTreeDto.plantingDate) {
//   //     updateData.plantingDate = new Date(updateTreeDto.plantingDate);
//   //   }

//   //   // Handle decimal conversions
//   //   if (updateTreeDto.altitude !== undefined) {
//   //     updateData.altitude = updateTreeDto.altitude ? updateTreeDto.altitude.toString() : null;
//   //   }
//   //   if (updateTreeDto.accuracy !== undefined) {
//   //     updateData.accuracy = updateTreeDto.accuracy ? updateTreeDto.accuracy.toString() : null;
//   //   }

//   //   await this.db
//   //     .update(trees)
//   //     .set(updateData)
//   //     .where(eq(trees.id, id));

//   //   return this.findOne(id);
//   // }

//   // async remove(id: number): Promise<void> {
//   //   const existingTree = await this.db
//   //     .select()
//   //     .from(trees)
//   //     .where(and(
//   //       eq(trees.id, id),
//   //       sql`${trees.deletedAt} IS NULL`
//   //     ))
//   //     .limit(1);

//   //   if (existingTree.length === 0) {
//   //     throw new NotFoundException('Tree not found');
//   //   }

//   //   return await this.db.transaction(async (tx) => {
//   //     // Soft delete tree
//   //     await tx
//   //       .update(trees)
//   //       .set({ 
//   //         deletedAt: new Date(),
//   //         updatedAt: new Date()
//   //       })
//   //       .where(eq(trees.id, id));

//   //     // Update intervention tree counts
//   //     if (existingTree[0].interventionId) {
//   //       await this.updateInterventionTreeCounts(tx, existingTree[0].interventionId);
//   //     }
//   //   });
//   // }

//   // // Tree Records Management
//   // async createRecord(createRecordDto: CreateTreeRecordDto, userId: number): Promise<TreeRecordResponseDto> {
//   //   // Validate tree exists
//   //   const tree = await this.db
//   //     .select()
//   //     .from(trees)
//   //     .where(and(
//   //       eq(trees.id, createRecordDto.treeId),
//   //       sql`${trees.deletedAt} IS NULL`
//   //     ))
//   //     .limit(1);

//   //   if (tree.length === 0) {
//   //     throw new NotFoundException('Tree not found');
//   //   }

//   //   return await this.db.transaction(async (tx) => {
//   //     // Create record
//   //     const [newRecord] = await tx
//   //       .insert(treeRecords)
//   //       .values({
//   //         uid: this.generateUID(),
//   //         treeId: createRecordDto.treeId,
//   //         recordedById: userId,
//   //         height: createRecordDto.height,
//   //         diameter: createRecordDto.diameter,
//   //         crownDiameter: createRecordDto.crownDiameter,
//   //         healthScore: createRecordDto.healthScore,
//   //         previousStatus: createRecordDto.previousStatus,
//   //         newStatus: createRecordDto.newStatus,
//   //         statusReason: createRecordDto.statusReason,
//   //         notes: createRecordDto.notes,
//   //         measurements: createRecordDto.measurements,
//   //         allImages: createRecordDto.allImages,
//   //         image: createRecordDto.image,
//   //         imageCdn: createRecordDto.imageCdn,
//   //         recordType: createRecordDto.recordType || 'measurement',
//   //         metadata: createRecordDto.metadata,
//   //       })
//   //       .returning();

//   //     // Update tree with latest measurements
//   //     const updateData: any = { lastMeasurementDate: new Date() };

//   //     if (createRecordDto.height !== undefined) {
//   //       updateData.currentHeight = createRecordDto.height;
//   //     }
//   //     if (createRecordDto.diameter !== undefined) {
//   //       updateData.currentDiameter = createRecordDto.diameter;
//   //     }
//   //     if (createRecordDto.newStatus) {
//   //       updateData.status = createRecordDto.newStatus;
//   //     }

//   //     await tx
//   //       .update(trees)
//   //       .set(updateData)
//   //       .where(eq(trees.id, createRecordDto.treeId));

//   //     return this.findOneRecord(newRecord.id);
//   //   });
//   // }

//   // async findOneRecord(id: number): Promise<TreeRecordResponseDto> {
//   //   const data = await this.db
//   //     .select({
//   //       id: treeRecords.id,
//   //       uid: treeRecords.uid,
//   //       treeId: treeRecords.treeId,
//   //       height: treeRecords.height,
//   //       diameter: treeRecords.diameter,
//   //       crownDiameter: treeRecords.crownDiameter,
//   //       healthScore: treeRecords.healthScore,
//   //       previousStatus: treeRecords.previousStatus,
//   //       newStatus: treeRecords.newStatus,
//   //       statusReason: treeRecords.statusReason,
//   //       notes: treeRecords.notes,
//   //       measurements: treeRecords.measurements,
//   //       allImages: treeRecords.allImages,
//   //       image: treeRecords.image,
//   //       imageCdn: treeRecords.imageCdn,
//   //       recordType: treeRecords.recordType,
//   //       recordedById: treeRecords.recordedById,
//   //       createdAt: treeRecords.createdAt,
//   //       updatedAt: treeRecords.updatedAt,
//   //       // Related data
//   //       recordedByName: users.name,
//   //     })
//   //     .from(treeRecords)
//   //     .leftJoin(users, eq(treeRecords.recordedById, users.id))
//   //     .where(and(
//   //       eq(treeRecords.id, id),
//   //       sql`${treeRecords.deletedAt} IS NULL`
//   //     ))
//   //     .limit(1);

//   //   if (data.length === 0) {
//   //     throw new NotFoundException('Tree record not found');
//   //   }

//   //   return data[0] as TreeRecordResponseDto;
//   // }

//   // async updateRecord(id: number, updateRecordDto: UpdateTreeRecordDto): Promise<TreeRecordResponseDto> {
//   //   const existingRecord = await this.db
//   //     .select()
//   //     .from(treeRecords)
//   //     .where(and(
//   //       eq(treeRecords.id, id),
//   //       sql`${treeRecords.deletedAt} IS NULL`
//   //     ))
//   //     .limit(1);

//   //   if (existingRecord.length === 0) {
//   //     throw new NotFoundException('Tree record not found');
//   //   }

//   //   const updateData = {
//   //     ...updateRecordDto,
//   //     updatedAt: new Date(),
//   //   };

//   //   await this.db
//   //     .update(treeRecords)
//   //     .set(updateData)
//   //     .where(eq(treeRecords.id, id));

//   //   return this.findOneRecord(id);
//   // }

//   // async removeRecord(id: number): Promise<void> {
//   //   const existingRecord = await this.db
//   //     .select()
//   //     .from(treeRecords)
//   //     .where(and(
//   //       eq(treeRecords.id, id),
//   //       sql`${treeRecords.deletedAt} IS NULL`
//   //     ))
//   //     .limit(1);

//   //   if (existingRecord.length === 0) {
//   //     throw new NotFoundException('Tree record not found');
//   //   }

//   //   // Soft delete record
//   //   await this.db
//   //     .update(treeRecords)
//   //     .set({ 
//   //       deletedAt: new Date(),
//   //       updatedAt: new Date()
//   //     })
//   //     .where(eq(treeRecords.id, id));
//   // }

//   // async getTreeRecords(treeId: number): Promise<TreeRecordResponseDto[]> {
//   //   return await this.db
//   //     .select({
//   //       id: treeRecords.id,
//   //       uid: treeRecords.uid,
//   //       treeId: treeRecords.treeId,
//   //       height: treeRecords.height,
//   //       diameter: treeRecords.diameter,
//   //       crownDiameter: treeRecords.crownDiameter,
//   //       healthScore: treeRecords.healthScore,
//   //       previousStatus: treeRecords.previousStatus,
//   //       newStatus: treeRecords.newStatus,
//   //       statusReason: treeRecords.statusReason,
//   //       notes: treeRecords.notes,
//   //       measurements: treeRecords.measurements,
//   //       recordType: treeRecords.recordType,
//   //       recordedById: treeRecords.recordedById,
//   //       createdAt: treeRecords.createdAt,
//   //       // Related data
//   //       recordedByName: users.name,
//   //     })
//   //     .from(treeRecords)
//   //     .leftJoin(users, eq(treeRecords.recordedById, users.id))
//   //     .where(and(
//   //       eq(treeRecords.treeId, treeId),
//   //       sql`${treeRecords.deletedAt} IS NULL`
//   //     ))
//   //     .orderBy(desc(treeRecords.createdAt));
//   // }

//   // // Bulk Operations
//   // async bulkImport(file: Express.Multer.File, interventionId: number, userId: number, validateOnly: boolean = false): Promise<BulkTreeImportResultDto> {
//   //   if (!file) {
//   //     throw new BadRequestException('No file provided');
//   //   }

//   //   // Validate intervention exists
//   //   const intervention = await this.db
//   //     .select()
//   //     .from(interventions)
//   //     .where(and(
//   //       eq(interventions.id, interventionId),
//   //       sql`${interventions.deletedAt} IS NULL`
//   //     ))
//   //     .limit(1);

//   //   if (intervention.length === 0) {
//   //     throw new NotFoundException('Intervention not found');
//   //   }

//   //   let workbook: XLSX.WorkBook;
//   //   try {
//   //     workbook = XLSX.read(file.buffer, { type: 'buffer' });
//   //   } catch (error) {
//   //     throw new BadRequestException('Invalid file format. Please provide a valid Excel file.');
//   //   }

//   //   const sheetName = workbook.SheetNames[0];
//   //   const worksheet = workbook.Sheets[sheetName];
//   //   const jsonData = XLSX.utils.sheet_to_json(worksheet);

//   //   if (jsonData.length === 0) {
//   //     throw new BadRequestException('File is empty or contains no valid data');
//   //   }

//   //   const result: BulkTreeImportResultDto = {
//   //     totalRecords: jsonData.length,
//   //     successCount: 0,
//   //     errorCount: 0,
//   //     errors: [],
//   //     successfulIds: [],
//   //   };

//   //   const validTrees: CreateTreeDto[] = [];

//   //   // Validate each row
//   //   for (let i = 0; i < jsonData.length; i++) {
//   //     const row = jsonData[i] as any;
//   //     const rowNumber = i + 2; // Excel row number (1-indexed + header)

//   //     try {
//   //       const treeData = this.mapRowToTree(row, interventionId);
//   //       await this.validateTreeData(treeData);
//   //       validTrees.push(treeData);
//   //     } catch (error) {
//   //       result.errorCount++;
//   //       result.errors.push(`Row ${rowNumber}: ${error.message}`);
//   //     }
//   //   }

//   //   result.successCount = validTrees.length;

//   //   // If validation only, return results without importing
//   //   if (validateOnly) {
//   //     return result;
//   //   }

//   //   // Import valid trees
//   //   if (validTrees.length > 0) {
//   //     try {
//   //       await this.db.transaction(async (tx) => {
//   //         for (const treeData of validTrees) {
//   //           try {
//   //             const created = await this.create(treeData, userId);
//   //             result.successfulIds.push(created.uid);
//   //           } catch (error) {
//   //             result.successCount--;
//   //             result.errorCount++;
//   //             result.errors.push(`Failed to create tree ${treeData.tag || 'unknown'}: ${error.message}`);
//   //           }
//   //         }
//   //       });
//   //     } catch (error) {
//   //       throw new BadRequestException(`Bulk import failed: ${error.message}`);
//   //     }
//   //   }

//   //   return result;
//   // }

//   // async bulkExport(query: QueryTreeDto): Promise<Buffer> {
//   //   // Get all trees based on query (without pagination)
//   //   const exportQuery = { ...query, page: 1, limit: 10000 };
//   //   const { data } = await this.findAll(exportQuery);

//   //   // Transform data for export
//   //   const exportData = data.map(tree => ({
//   //     UID: tree.uid,
//   //     Tag: tree.tag,
//   //     'Intervention HID': tree.interventionHid,
//   //     'Scientific Name': tree.scientificName,
//   //     'Common Name': tree.commonName,
//   //     Type: tree.type,
//   //     Latitude: tree.latitude,
//   //     Longitude: tree.longitude,
//   //     Altitude: tree.altitude,
//   //     Accuracy: tree.accuracy,
//   //     'Current Height': tree.currentHeight,
//   //     'Current Diameter': tree.currentDiameter,
//   //     Status: tree.status,
//   //     'Planting Date': tree.plantingDate,
//   //     'Last Measurement': tree.lastMeasurementDate,
//   //     'Created By': tree.createdByName,
//   //     'Records Count': tree.records.length,
//   //     'Created At': tree.createdAt,
//   //   }));

//   //   // Create workbook and worksheet
//   //   const workbook = XLSX.utils.book_new();
//   //   const worksheet = XLSX.utils.json_to_sheet(exportData);

//   //   // Add worksheet to workbook
//   //   XLSX.utils.book_append_sheet(workbook, worksheet, 'Trees');

//   //   // Generate buffer
//   //   return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
//   // }

//   // // Statistics
//   // async getTreeStats(interventionId?: number): Promise<TreeStatsDto> {
//   //   const conditions = [sql`${trees.deletedAt} IS NULL`];
    
//   //   if (interventionId) {
//   //     conditions.push(eq(trees.interventionId, interventionId));
//   //   }

//   //   const whereClause = and(...conditions);

//   //   // Get basic counts
//   //   const [totalResult] = await this.db
//   //     .select({ total: count() })
//   //     .from(trees)
//   //     .where(whereClause);

//   //   // Get status breakdown
//   //   const statusBreakdown = await this.db
//   //     .select({
//   //       status: trees.status,
//   //       count: count(),
//   //     })
//   //     .from(trees)
//   //     .where(whereClause)
//   //     .groupBy(trees.status);

//   //   // Get type breakdown
//   //   const typeBreakdown = await this.db
//   //     .select({
//   //       type: trees.type,
//   //       count: count(),
//   //     })
//   //     .from(trees)
//   //     .where(whereClause)
//   //     .groupBy(trees.type);

//   //   // Get species breakdown
//   //   const speciesBreakdown = await this.db
//   //     .select({
//   //       scientificName: scientificSpecies.scientificName,
//   //       count: count(),
//   //     })
//   //     .from(trees)
//   //     .leftJoin(scientificSpecies, eq(trees.scientificSpeciesId, scientificSpecies.id))
//   //     .where(whereClause)
//   //     .groupBy(scientificSpecies.scientificName);

//   //   // Get averages
//   //   const [averages] = await this.db
//   //     .select({
//   //       avgHeight: avg(trees.currentHeight),
//   //       avgDiameter: avg(trees.currentDiameter),
//   //     })
//   //     .from(trees)
//   //     .where(and(
//   //       whereClause,
//   //       sql`${trees.currentHeight} IS NOT NULL`,
//   //       sql`${trees.currentDiameter} IS NOT NULL`
//   //     ));

//   //   // Get trees with records count
//   //   const [treesWithRecords] = await this.db
//   //     .select({ count: count() })
//   //     .from(trees)
//   //     .innerJoin(treeRecords, eq(trees.id, treeRecords.treeId))
//   //     .where(and(
//   //       whereClause,
//   //       sql`${treeRecords.deletedAt} IS NULL`
//   //     ));

//   //   // Get total records count
//   //   const [totalRecords] = await this.db
//   //     .select({ count: count() })
//   //     .from(treeRecords)
//   //     .innerJoin(trees, eq(treeRecords.treeId, trees.id))
//   //     .where(and(
//   //       whereClause,
//   //       sql`${treeRecords.deletedAt} IS NULL`
//   //     ));

//   //   // Get last measurement
//   //   const [lastMeasurement] = await this.db
//   //     .select({ lastMeasurement: trees.lastMeasurementDate })
//   //     .from(trees)
//   //     .where(and(
//   //       whereClause,
//   //       sql`${trees.lastMeasurementDate} IS NOT NULL`
//   //     ))
//   //     .orderBy(desc(trees.lastMeasurementDate))
//   //     .limit(1);

//   //   // Calculate survival rate
//   //   const aliveCount = statusBreakdown.find(s => s.status === 'alive')?.count || 0;
//   //   const totalCount = Number(totalResult.total);
//   //   const survivalRate = totalCount > 0 ? (Number(aliveCount) / totalCount) * 100 : 0;

//   //   return {
//   //     totalTrees: totalCount,
//   //     statusBreakdown: statusBreakdown.reduce((acc, item) => {
//   //       acc[item.status] = Number(item.count);
//   //       return acc;
//   //     }, {} as Record<string, number>),
//   //     typeBreakdown: typeBreakdown.reduce((acc, item) => {
//   //       acc[item.type || 'unknown'] = Number(item.count);
//   //       return acc;
//   //     }, {} as Record<string, number>),
//   //     speciesBreakdown: speciesBreakdown.reduce((acc, item) => {
//   //       acc[item.scientificName || 'unknown'] = Number(item.count);
//   //       return acc;
//   //     }, {} as Record<string, number>),
//   //     averageHeight: Number(averages?.avgHeight || 0),
//   //     averageDiameter: Number(averages?.avgDiameter || 0),
//   //     survivalRate: Number(survivalRate.toFixed(1)),
//   //     treesWithRecords: Number(treesWithRecords?.count || 0),
//   //     totalRecords: Number(totalRecords?.count || 0),
//   //     lastMeasurement: lastMeasurement?.lastMeasurement?.toISOString() || null,
//   //   };
//   // }

//   // // Private helper methods
//   // private generateUID(): string {
//   //   return `tree_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//   // }

//   // private getSortColumn(sortBy: string) {
//   //   const sortColumns = {
//   //     createdAt: trees.createdAt,
//   //     updatedAt: trees.updatedAt,
//   //     tag: trees.tag,
//   //     type: trees.type,
//   //     status: trees.status,
//   //     plantingDate: trees.plantingDate,
//   //     lastMeasurementDate: trees.lastMeasurementDate,
//   //     currentHeight: trees.currentHeight,
//   //     currentDiameter: trees.currentDiameter,
//   //   };

//   //   return sortColumns[sortBy] || trees.createdAt;
//   // }

//   // private async getRecentTreeRecords(treeIds: number[]): Promise<Record<number, TreeRecordResponseDto[]>> {
//   //   if (treeIds.length === 0) return {};

//   //   const records = await this.db
//   //     .select({
//   //       treeId: treeRecords.treeId,
//   //       id: treeRecords.id,
//   //       uid: treeRecords.uid,
//   //       height: treeRecords.height,
//   //       diameter: treeRecords.diameter,
//   //       crownDiameter: treeRecords.crownDiameter,
//   //       healthScore: treeRecords.healthScore,
//   //       previousStatus: treeRecords.previousStatus,
//   //       newStatus: treeRecords.newStatus,
//   //       statusReason: treeRecords.statusReason,
//   //       notes: treeRecords.notes,
//   //       recordType: treeRecords.recordType,
//   //       recordedById: treeRecords.recordedById,
//   //       createdAt: treeRecords.createdAt,
//   //       recordedByName: users.name,
//   //     })
//   //     .from(treeRecords)
//   //     .leftJoin(users, eq(treeRecords.recordedById, users.id))
//   //     .where(and(
//   //       inArray(treeRecords.treeId, treeIds),
//   //       sql`${treeRecords.deletedAt} IS NULL`
//   //     ))
//   //     .orderBy(desc(treeRecords.createdAt));

//   //   const grouped: Record<number, TreeRecordResponseDto[]> = {};
//   //   for (const record of records) {
//   //     if (!grouped[record.treeId]) {
//   //       grouped[record.treeId] = [];
//   //     }
//   //     // Only keep the 3 most recent records per tree
//   //     if (grouped[record.treeId].length < 3) {
//   //       grouped[record.treeId].push(record as TreeRecordResponseDto);
//   //     }
//   //   }

//   //   return grouped;
//   // }

//   // private async updateInterventionTreeCounts(tx: any, interventionId: number): Promise<void> {
//   //   // Get tree counts for the intervention
//   //   const [result] = await tx
//   //     .select({
//   //       totalTrees: count(),
//   //       sampleTrees: sql<number>`COUNT(*) FILTER (WHERE ${trees.type} = 'sample')`,
//   //     })
//   //     .from(trees)
//   //     .where(and(
//   //       eq(trees.interventionId, interventionId),
//   //       sql`${trees.deletedAt} IS NULL`
//   //     ));

//   //   // Update intervention with current tree counts
//   //   await tx
//   //     .update(interventions)
//   //     .set({
//   //       treesPlanted: Number(result.totalTrees),
//   //       sampleTreeCount: Number(result.sampleTrees),
//   //       updatedAt: new Date(),
//   //     })
//   //     .where(eq(interventions.id, interventionId));
//   // }

//   // private mapRowToTree(row: any, interventionId: number): CreateTreeDto {
//   //   return {
//   //     interventionId,
//   //     scientificSpeciesId: parseInt(row['Species ID'] || row['scientificSpeciesId']) || undefined,
//   //     interventionSpeciesId: parseInt(row['Intervention Species ID'] || row['interventionSpeciesId']) || undefined,
//   //     tag: row['Tag'] || row['tag'],
//   //     type: row['Type'] || row['type'] || 'regular',
//   //     latitude: parseFloat(row['Latitude'] || row['latitude'] || '0'),
//   //     longitude: parseFloat(row['Longitude'] || row['longitude'] || '0'),
//   //     altitude: parseFloat(row['Altitude'] || row['altitude']) || undefined,
//   //     accuracy: parseFloat(row['Accuracy'] || row['accuracy']) || undefined,
//   //     currentHeight: parseFloat(row['Height'] || row['currentHeight']) || undefined,
//   //     currentDiameter: parseFloat(row['Diameter'] || row['currentDiameter']) || undefined,
//   //     status: row['Status'] || row['status'] || 'alive',
//   //     plantingDate: row['Planting Date'] || row['plantingDate'],
//   //   };
//   // }

//   // private async validateTreeData(data: CreateTreeDto): Promise<void> {
//   //   // Validate required fields
//   //   if (!data.latitude || !data.longitude) {
//   //     throw new Error('Coordinates are required');
//   //   }

//   //   // Validate coordinate ranges
//   //   if (data.latitude < -90 || data.latitude > 90) {
//   //     throw new Error('Latitude must be between -90 and 90');
//   //   }
//   //   if (data.longitude < -180 || data.longitude > 180) {
//   //     throw new Error('Longitude must be between -180 and 180');
//   //   }

//   //   // Validate measurements if provided
//   //   if (data.currentHeight !== undefined && data.currentHeight < 0) {
//   //     throw new Error('Height must be positive');
//   //   }
//   //   if (data.currentDiameter !== undefined && data.currentDiameter < 0) {
//   //     throw new Error('Diameter must be positive');
//   //   }
//   //   if (data.altitude !== undefined && data.altitude < -500) {
//   //     throw new Error('Altitude seems unrealistic');
//   //   }
//   // }
// }