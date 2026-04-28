// import {
//   Controller,
//   Get,
//   Post,
//   Body,
//   Patch,
//   Param,
//   Delete,
//   Query,
//   UseGuards,
//   UseInterceptors,
//   UploadedFile,
//   ParseIntPipe,
//   Res,
//   HttpStatus,
//   HttpException,
// } from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { Response } from 'express';
// import {
//   ApiTags,
//   ApiOperation,
//   ApiResponse,
//   ApiBearerAuth,
//   ApiConsumes,
//   ApiParam,
//   ApiQuery,
// } from '@nestjs/swagger';
// import { TreesService } from './trees.service';
// import {
//   CreateTreeDto,
//   UpdateTreeDto,
//   QueryTreeDto,
//   CreateTreeRecordDto,
//   UpdateTreeRecordDto,
//   BulkTreeImportDto,
//   BulkTreeImportResultDto,
//   TreeResponseDto,
//   TreeRecordResponseDto,
//   TreeStatsDto,
// } from './dto/trees.dto';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Adjust import path
// import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard'; // Adjust import path
// import { CurrentUser } from '../auth/current-user.decorator'; // Adjust import path
// import { ProjectRoles } from 'src/projects/decorators/project-roles.decorator';
// import { Membership } from 'src/projects/decorators/membership.decorator';


// @ApiTags('Trees')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
// @Controller('trees')
// export class TreesController {
//   constructor(private readonly treesService: TreesService) { }

//   // @Post()
//   // @UseGuards(ProjectPermissionsGuard)
//   // @ProjectRoles('owner', 'admin')
//   // @ApiOperation({ summary: 'Create a new tree' })
//   // @ApiResponse({
//   //   status: HttpStatus.CREATED,
//   //   description: 'Tree created successfully',
//   //   type: TreeResponseDto,
//   // })
//   // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
//   // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Intervention or species not found' })
//   // async create(
//   //   @Body() createTreeDto: CreateTreeDto,
//   //   @CurrentUser() user: any,
//   // ): Promise<TreeResponseDto> {
//   //   return this.treesService.create(createTreeDto, user.id);
//   // }

//   // @Get()
//   // @ApiOperation({ summary: 'Get all trees with filtering and pagination' })
//   // @ApiResponse({
//   //   status: HttpStatus.OK,
//   //   description: 'Trees retrieved successfully',
//   //   type: [TreeResponseDto],
//   // })
//   // @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
//   // @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
//   // @ApiQuery({ name: 'interventionId', required: false, type: Number, description: 'Filter by intervention ID' })
//   // @ApiQuery({ name: 'scientificSpeciesId', required: false, type: Number, description: 'Filter by species ID' })
//   // @ApiQuery({ name: 'status', required: false, description: 'Filter by tree status' })
//   // @ApiQuery({ name: 'type', required: false, type: String, description: 'Filter by tree type' })
//   // @ApiQuery({ name: 'plantingDateStart', required: false, type: String, description: 'Filter by planting date start (YYYY-MM-DD)' })
//   // @ApiQuery({ name: 'plantingDateEnd', required: false, type: String, description: 'Filter by planting date end (YYYY-MM-DD)' })
//   // @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in tree tag' })
//   // @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort by field' })
//   // @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
//   // async findAll(@Query() query: QueryTreeDto) {
//   //   return this.treesService.findAll(query);
//   // }

//   // @Get('export')
//   // @ApiOperation({ summary: 'Export trees to Excel' })
//   // @ApiResponse({
//   //   status: HttpStatus.OK,
//   //   description: 'Trees exported successfully',
//   // })
//   // async export(@Query() query: QueryTreeDto, @Res() res: Response) {
//   //   try {
//   //     const buffer = await this.treesService.bulkExport(query);

//   //     const filename = `trees_export_${new Date().toISOString().split('T')[0]}.xlsx`;

//   //     res.set({
//   //       'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//   //       'Content-Disposition': `attachment; filename="${filename}"`,
//   //       'Content-Length': buffer.length,
//   //     });

//   //     res.send(buffer);
//   //   } catch (error) {
//   //     throw new HttpException(
//   //       `Export failed: ${error.message}`,
//   //       HttpStatus.INTERNAL_SERVER_ERROR,
//   //     );
//   //   }
//   // }

//   // @Post('import')
//   // @UseGuards(ProjectPermissionGuard)
//   // @RequireProjectPermission('contributor')
//   // @UseInterceptors(FileInterceptor('file'))
//   // @ApiConsumes('multipart/form-data')
//   // @ApiOperation({ summary: 'Bulk import trees from Excel file' })
//   // @ApiResponse({
//   //   status: HttpStatus.CREATED,
//   //   description: 'Trees imported successfully',
//   //   type: BulkTreeImportResultDto,
//   // })
//   // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid file or data' })
//   // async bulkImport(
//   //   @UploadedFile() file: Express.Multer.File,
//   //   @Body() importDto: BulkTreeImportDto,
//   //   @CurrentUser() user: any,
//   // ): Promise<BulkTreeImportResultDto> {
//   //   if (!file) {
//   //     throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
//   //   }

//   //   return this.treesService.bulkImport(
//   //     file,
//   //     importDto.interventionId,
//   //     user.id,
//   //     importDto.validateOnly,
//   //   );
//   // }

//   // @Post('validate-import')
//   // @UseGuards(ProjectPermissionGuard)
//   // @RequireProjectPermission('contributor')
//   // @UseInterceptors(FileInterceptor('file'))
//   // @ApiConsumes('multipart/form-data')
//   // @ApiOperation({ summary: 'Validate bulk import file without importing' })
//   // @ApiResponse({
//   //   status: HttpStatus.OK,
//   //   description: 'File validated successfully',
//   //   type: BulkTreeImportResultDto,
//   // })
//   // async validateImport(
//   //   @UploadedFile() file: Express.Multer.File,
//   //   @Body() importDto: BulkTreeImportDto,
//   //   @CurrentUser() user: any,
//   // ): Promise<BulkTreeImportResultDto> {
//   //   if (!file) {
//   //     throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
//   //   }

//   //   return this.treesService.bulkImport(
//   //     file,
//   //     importDto.interventionId,
//   //     user.id,
//   //     true, // validateOnly = true
//   //   );
//   // }

//   // @Get('stats')
//   // @ApiOperation({ summary: 'Get tree statistics' })
//   // @ApiQuery({ name: 'interventionId', required: false, type: Number, description: 'Filter by intervention ID' })
//   // @ApiResponse({
//   //   status: HttpStatus.OK,
//   //   description: 'Tree statistics retrieved successfully',
//   //   type: TreeStatsDto,
//   // })
//   // async getStats(@Query('interventionId') interventionId?: number): Promise<TreeStatsDto> {
//   //   return this.treesService.getTreeStats(interventionId);
//   // }

//   // @Get(':id')
//   // @ApiOperation({ summary: 'Get tree by ID' })
//   // @ApiParam({ name: 'id', type: Number, description: 'Tree ID' })
//   // @ApiResponse({
//   //   status: HttpStatus.OK,
//   //   description: 'Tree retrieved successfully',
//   //   type: TreeResponseDto,
//   // })
//   // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Tree not found' })
//   // async findOne(@Param('id', ParseIntPipe) id: number): Promise<TreeResponseDto> {
//   //   return this.treesService.findOne(id);
//   // }

//   // @Get(':id/records')
//   // @ApiOperation({ summary: 'Get all records for a tree' })
//   // @ApiParam({ name: 'id', type: Number, description: 'Tree ID' })
//   // @ApiResponse({
//   //   status: HttpStatus.OK,
//   //   description: 'Tree records retrieved successfully',
//   //   type: [TreeRecordResponseDto],
//   // })
//   // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Tree not found' })
//   // async getTreeRecords(@Param('id', ParseIntPipe) id: number): Promise<TreeRecordResponseDto[]> {
//   //   return this.treesService.getTreeRecords(id);
//   // }

//   // @Patch(':id')
//   // @UseGuards(ProjectPermissionGuard)
//   // @RequireProjectPermission('contributor')
//   // @ApiOperation({ summary: 'Update tree' })
//   // @ApiParam({ name: 'id', type: Number, description: 'Tree ID' })
//   // @ApiResponse({
//   //   status: HttpStatus.OK,
//   //   description: 'Tree updated successfully',
//   //   type: TreeResponseDto,
//   // })
//   // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Tree not found' })
//   // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
//   // async update(
//   //   @Param('id', ParseIntPipe) id: number,
//   //   @Body() updateTreeDto: UpdateTreeDto,
//   // ): Promise<TreeResponseDto> {
//   //   return this.treesService.update(id, updateTreeDto);
//   // }

//   // @Delete(':id')
//   // @UseGuards(ProjectPermissionGuard)
//   // @RequireProjectPermission('manager')
//   // @ApiOperation({ summary: 'Soft delete tree' })
//   // @ApiParam({ name: 'id', type: Number, description: 'Tree ID' })
//   // @ApiResponse({
//   //   status: HttpStatus.OK,
//   //   description: 'Tree deleted successfully',
//   // })
//   // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Tree not found' })
//   // async remove(@Param('id', ParseIntPipe) id: number) {
//   //   await this.treesService.remove(id);
//   //   return { message: 'Tree deleted successfully' };
//   // }

//   // // Tree Records endpoints
//   // @Post('records')
//   // @UseGuards(ProjectPermissionGuard)
//   // @RequireProjectPermission('contributor')
//   // @ApiOperation({ summary: 'Create a new tree record (measurement)' })
//   // @ApiResponse({
//   //   status: HttpStatus.CREATED,
//   //   description: 'Tree record created successfully',
//   //   type: TreeRecordResponseDto,
//   // })
//   // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
//   // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Tree not found' })
//   // async createRecord(
//   //   @Body() createRecordDto: CreateTreeRecordDto,
//   //   @CurrentUser() user: any,
//   // ): Promise<TreeRecordResponseDto> {
//   //   return this.treesService.createRecord(createRecordDto, user.id);
//   // }

//   // @Get('records/:recordId')
//   // @ApiOperation({ summary: 'Get tree record by ID' })
//   // @ApiParam({ name: 'recordId', type: Number, description: 'Tree Record ID' })
//   // @ApiResponse({
//   //   status: HttpStatus.OK,
//   //   description: 'Tree record retrieved successfully',
//   //   type: TreeRecordResponseDto,
//   // })
//   // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Tree record not found' })
//   // async findOneRecord(@Param('recordId', ParseIntPipe) recordId: number): Promise<TreeRecordResponseDto> {
//   //   return this.treesService.findOneRecord(recordId);
//   // }

//   // @Patch('records/:recordId')
//   // @UseGuards(ProjectPermissionGuard)
//   // @RequireProjectPermission('contributor')
//   // @ApiOperation({ summary: 'Update tree record' })
//   // @ApiParam({ name: 'recordId', type: Number, description: 'Tree Record ID' })
//   // @ApiResponse({
//   //   status: HttpStatus.OK,
//   //   description: 'Tree record updated successfully',
//   //   type: TreeRecordResponseDto,
//   // })
//   // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Tree record not found' })
//   // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
//   // async updateRecord(
//   //   @Param('recordId', ParseIntPipe) recordId: number,
//   //   @Body() updateRecordDto: UpdateTreeRecordDto,
//   // ): Promise<TreeRecordResponseDto> {
//   //   return this.treesService.updateRecord(recordId, updateRecordDto);
//   // }

//   // @Delete('records/:recordId')
//   // @UseGuards(ProjectPermissionGuard)
//   // @RequireProjectPermission('manager')
//   // @ApiOperation({ summary: 'Soft delete tree record' })
//   // @ApiParam({ name: 'recordId', type: Number, description: 'Tree Record ID' })
//   // @ApiResponse({
//   //   status: HttpStatus.OK,
//   //   description: 'Tree record deleted successfully',
//   // })
//   // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Tree record not found' })
//   // async removeRecord(@Param('recordId', ParseIntPipe) recordId: number) {
//   //   await this.treesService.removeRecord(recordId);
//   //   return { message: 'Tree record deleted successfully' };
//   // }

//   // // Intervention-specific endpoints
//   // @Get('interventions/:interventionId')
//   // @UseGuards(ProjectPermissionGuard)
//   // @RequireProjectPermission('observer')
//   // @ApiOperation({ summary: 'Get trees for a specific intervention' })
//   // @ApiParam({ name: 'interventionId', type: Number, description: 'Intervention ID' })
//   // @ApiResponse({
//   //   status: HttpStatus.OK,
//   //   description: 'Intervention trees retrieved successfully',
//   // })
//   // async getInterventionTrees(
//   //   @Param('interventionId', ParseIntPipe) interventionId: number,
//   //   @Query() query: QueryTreeDto,
//   // ) {
//   //   const interventionQuery = { ...query, interventionId };
//   //   return this.treesService.findAll(interventionQuery);
//   // }

//   // @Get('interventions/:interventionId/stats')
//   // @UseGuards(ProjectPermissionGuard)
//   // @RequireProjectPermission('observer')
//   // @ApiOperation({ summary: 'Get tree statistics for a specific intervention' })
//   // @ApiParam({ name: 'interventionId', type: Number, description: 'Intervention ID' })
//   // @ApiResponse({
//   //   status: HttpStatus.OK,
//   //   description: 'Intervention tree statistics retrieved successfully',
//   //   type: TreeStatsDto,
//   // })
//   // async getInterventionTreeStats(@Param('interventionId', ParseIntPipe) interventionId: number): Promise<TreeStatsDto> {
//   //   return this.treesService.getTreeStats(interventionId);
//   // }

//   // @Post('interventions/:interventionId/import')
//   // @UseGuards(ProjectPermissionGuard)
//   // @RequireProjectPermission('contributor')
//   // @UseInterceptors(FileInterceptor('file'))
//   // @ApiConsumes('multipart/form-data')
//   // @ApiOperation({ summary: 'Bulk import trees for a specific intervention' })
//   // @ApiParam({ name: 'interventionId', type: Number, description: 'Intervention ID' })
//   // @ApiResponse({
//   //   status: HttpStatus.CREATED,
//   //   description: 'Trees imported successfully for intervention',
//   //   type: BulkTreeImportResultDto,
//   // })
//   // async importInterventionTrees(
//   //   @Param('interventionId', ParseIntPipe) interventionId: number,
//   //   @UploadedFile() file: Express.Multer.File,
//   //   @Body() importDto: Omit<BulkTreeImportDto, 'interventionId'>,
//   //   @CurrentUser() user: any,
//   // ): Promise<BulkTreeImportResultDto> {
//   //   if (!file) {
//   //     throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
//   //   }

//   //   return this.treesService.bulkImport(
//   //     file,
//   //     interventionId,
//   //     user.id,
//   //     importDto.validateOnly,
//   //   );
//   // }

//   // @Get('interventions/:interventionId/export')
//   // @UseGuards(ProjectPermissionGuard)
//   // @RequireProjectPermission('observer')
//   // @ApiOperation({ summary: 'Export trees for a specific intervention' })
//   // @ApiParam({ name: 'interventionId', type: Number, description: 'Intervention ID' })
//   // @ApiResponse({
//   //   status: HttpStatus.OK,
//   //   description: 'Intervention trees exported successfully',
//   // })
//   // async exportInterventionTrees(
//   //   @Param('interventionId', ParseIntPipe) interventionId: number,
//   //   @Query() query: QueryTreeDto,
//   //   @Res() res: Response,
//   // ) {
//   //   try {
//   //     const exportQuery = { ...query, interventionId };
//   //     const buffer = await this.treesService.bulkExport(exportQuery);

//   //     const filename = `intervention_${interventionId}_trees_export_${new Date().toISOString().split('T')[0]}.xlsx`;

//   //     res.set({
//   //       'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//   //       'Content-Disposition': `attachment; filename="${filename}"`,
//   //       'Content-Length': buffer.length,
//   //     });

//   //     res.send(buffer);
//   //   } catch (error) {
//   //     throw new HttpException(
//   //       `Export failed: ${error.message}`,
//   //       HttpStatus.INTERNAL_SERVER_ERROR,
//   //     );
//   //   }
//   // }
// }