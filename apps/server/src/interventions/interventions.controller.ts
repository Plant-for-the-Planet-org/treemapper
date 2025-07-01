// src/modules/interventions/interventions.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Res,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { InterventionsService, PaginatedInterventionsResponse } from './interventions.service';
import {
  CreateInterventionDto,
  UpdateInterventionDto,
  QueryInterventionDto,
  BulkImportInterventionDto,
  BulkImportResultDto,
  InterventionResponseDto,
  CreateInterventionBulkDto,
} from './dto/interventions.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Adjust import path
import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard'; // Adjust import path
import { CurrentUser } from '../auth/current-user.decorator'; // Adjust import path
import { ProjectRoles } from 'src/projects/decorators/project-roles.decorator';
import { Membership } from 'src/projects/decorators/membership.decorator';


@UseGuards(JwtAuthGuard)
@Controller('interventions')
export class InterventionsController {
  constructor(private readonly interventionsService: InterventionsService) { }

  @Post('/projects/:id')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async create(
    @Body() createInterventionDto: CreateInterventionDto,
    @Membership() membership: any
  ): Promise<InterventionResponseDto> {
    return this.interventionsService.create(createInterventionDto, membership);
  }

  @Get('/projects/:id')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async findAllintervention(
    @Membership() membership: any
  ): Promise<PaginatedInterventionsResponse> {
    return this.interventionsService.findAll(membership);
  }

  @Post('/projects/:id/bulk')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async bulkUpload(
    @Body() interventionData: CreateInterventionBulkDto[],
    @Membership() membership: any
  ): Promise<InterventionResponseDto> {
    return this.interventionsService.bulk(interventionData, membership);
  }
  // @Get()
  // @ApiOperation({ summary: 'Get all interventions with filtering and pagination' })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Interventions retrieved successfully',
  //   type: [InterventionResponseDto],
  // })
  // @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  // @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  // @ApiQuery({ name: 'projectId', required: false, type: Number, description: 'Filter by project ID' })
  // @ApiQuery({ name: 'projectSiteId', required: false, type: Number, description: 'Filter by site ID' })
  // @ApiQuery({ name: 'userId', required: false, type: Number, description: 'Filter by user ID' })
  // @ApiQuery({ name: 'type', required: false, description: 'Filter by intervention type' })
  // @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  // @ApiQuery({ name: 'captureMode', required: false, description: 'Filter by capture mode' })
  // @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Filter by start date (YYYY-MM-DD)' })
  // @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Filter by end date (YYYY-MM-DD)' })
  // @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in HID, description, and tag' })
  // @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort by field' })
  // @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  // @ApiQuery({ name: 'includePrivate', required: false, type: Boolean, description: 'Include private interventions' })
  // async findAll(@Query() query: QueryInterventionDto, @CurrentUser() user: any) {
  //   return this.interventionsService.findAll(query, user.id);
  // }

  // @Get('export')
  // @ApiOperation({ summary: 'Export interventions to Excel' })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Interventions exported successfully',
  // })
  // async export(@Query() query: QueryInterventionDto, @Res() res: Response) {
  //   try {
  //     const buffer = await this.interventionsService.bulkExport(query);

  //     const filename = `interventions_export_${new Date().toISOString().split('T')[0]}.xlsx`;

  //     res.set({
  //       'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  //       'Content-Disposition': `attachment; filename="${filename}"`,
  //       'Content-Length': buffer.length,
  //     });

  //     res.send(buffer);
  //   } catch (error) {
  //     throw new HttpException(
  //       `Export failed: ${error.message}`,
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  // @Post('import')
  // @UseGuards(ProjectPermissionGuard)
  // @RequireProjectPermission('manager')
  // @UseInterceptors(FileInterceptor('file'))
  // @ApiConsumes('multipart/form-data')
  // @ApiOperation({ summary: 'Bulk import interventions from Excel file' })
  // @ApiResponse({
  //   status: HttpStatus.CREATED,
  //   description: 'Interventions imported successfully',
  //   type: BulkImportResultDto,
  // })
  // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid file or data' })
  // async bulkImport(
  //   @UploadedFile() file: Express.Multer.File,
  //   @Body() importDto: BulkImportInterventionDto,
  // ): Promise<BulkImportResultDto> {
  //   if (!file) {
  //     throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
  //   }

  //   return this.interventionsService.bulkImport(
  //     file,
  //     importDto.projectId,
  //     importDto.validateOnly,
  //   );
  // }

  // @Post('validate-import')
  // @UseGuards(ProjectPermissionGuard)
  // @RequireProjectPermission('contributor')
  // @UseInterceptors(FileInterceptor('file'))
  // @ApiConsumes('multipart/form-data')
  // @ApiOperation({ summary: 'Validate bulk import file without importing' })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'File validated successfully',
  //   type: BulkImportResultDto,
  // })
  // async validateImport(
  //   @UploadedFile() file: Express.Multer.File,
  //   @Body() importDto: BulkImportInterventionDto,
  // ): Promise<BulkImportResultDto> {
  //   if (!file) {
  //     throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
  //   }

  //   return this.interventionsService.bulkImport(
  //     file,
  //     importDto.projectId,
  //     true, // validateOnly = true
  //   );
  // }

  // @Get(':id')
  // @ApiOperation({ summary: 'Get intervention by ID' })
  // @ApiParam({ name: 'id', type: Number, description: 'Intervention ID' })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Intervention retrieved successfully',
  //   type: InterventionResponseDto,
  // })
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Intervention not found' })
  // async findOne(@Param('id', ParseIntPipe) id: number): Promise<InterventionResponseDto> {
  //   return this.interventionsService.findOne(id);
  // }

  // @Get(':id/trees')
  // @ApiOperation({ summary: 'Get all trees for an intervention' })
  // @ApiParam({ name: 'id', type: Number, description: 'Intervention ID' })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Trees retrieved successfully',
  // })
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Intervention not found' })
  // async getInterventionTrees(@Param('id', ParseIntPipe) id: number) {
  //   return this.interventionsService.getInterventionTrees(id);
  // }

  // @Patch(':id')
  // @UseGuards(ProjectPermissionGuard)
  // @RequireProjectPermission('contributor')
  // @ApiOperation({ summary: 'Update intervention' })
  // @ApiParam({ name: 'id', type: Number, description: 'Intervention ID' })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Intervention updated successfully',
  //   type: InterventionResponseDto,
  // })
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Intervention not found' })
  // @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  // async update(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Body() updateInterventionDto: UpdateInterventionDto,
  // ): Promise<InterventionResponseDto> {
  //   return this.interventionsService.update(id, updateInterventionDto);
  // }

  // @Patch(':id/tree-counts')
  // @UseGuards(ProjectPermissionGuard)
  // @RequireProjectPermission('contributor')
  // @ApiOperation({ summary: 'Update tree counts for intervention (recalculate from trees table)' })
  // @ApiParam({ name: 'id', type: Number, description: 'Intervention ID' })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Tree counts updated successfully',
  // })
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Intervention not found' })
  // async updateTreeCounts(@Param('id', ParseIntPipe) id: number) {
  //   await this.interventionsService.updateTreeCounts(id);
  //   return { message: 'Tree counts updated successfully' };
  // }

  // @Delete(':id')
  // @UseGuards(ProjectPermissionGuard)
  // @RequireProjectPermission('manager')
  // @ApiOperation({ summary: 'Soft delete intervention' })
  // @ApiParam({ name: 'id', type: Number, description: 'Intervention ID' })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Intervention deleted successfully',
  // })
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Intervention not found' })
  // async remove(@Param('id', ParseIntPipe) id: number) {
  //   await this.interventionsService.remove(id);
  //   return { message: 'Intervention deleted successfully' };
  // }

  // // Project-specific endpoints
  // @Get('projects/:projectId')
  // @UseGuards(ProjectPermissionGuard)
  // @RequireProjectPermission('observer')
  // @ApiOperation({ summary: 'Get interventions for a specific project' })
  // @ApiParam({ name: 'projectId', type: Number, description: 'Project ID' })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Project interventions retrieved successfully',
  // })
  // async getProjectInterventions(
  //   @Param('projectId', ParseIntPipe) projectId: number,
  //   @Query() query: QueryInterventionDto,
  // ) {
  //   const projectQuery = { ...query, projectId };
  //   return this.interventionsService.findAll(projectQuery);
  // }

  // @Get('projects/:projectId/sites/:siteId')
  // @UseGuards(ProjectPermissionGuard)
  // @RequireProjectPermission('observer')
  // @ApiOperation({ summary: 'Get interventions for a specific site' })
  // @ApiParam({ name: 'projectId', type: Number, description: 'Project ID' })
  // @ApiParam({ name: 'siteId', type: Number, description: 'Site ID' })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Site interventions retrieved successfully',
  // })
  // async getSiteInterventions(
  //   @Param('projectId', ParseIntPipe) projectId: number,
  //   @Param('siteId', ParseIntPipe) siteId: number,
  //   @Query() query: QueryInterventionDto,
  // ) {
  //   const siteQuery = { ...query, projectId, projectSiteId: siteId };
  //   return this.interventionsService.findAll(siteQuery);
  // }

  // @Get('projects/:projectId/stats')
  // @UseGuards(ProjectPermissionGuard)
  // @RequireProjectPermission('observer')
  // @ApiOperation({ summary: 'Get intervention statistics for a project' })
  // @ApiParam({ name: 'projectId', type: Number, description: 'Project ID' })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Project intervention statistics retrieved successfully',
  // })
  // async getProjectInterventionStats(@Param('projectId', ParseIntPipe) projectId: number) {
  //   // This could be extended to provide more detailed statistics
  //   const query: QueryInterventionDto = { projectId, limit: 1000 };
  //   const { data, total } = await this.interventionsService.findAll(query);

  //   const stats = {
  //     totalInterventions: total,
  //     typeBreakdown: data.reduce((acc, intervention) => {
  //       acc[intervention.type] = (acc[intervention.type] || 0) + 1;
  //       return acc;
  //     }, {} as Record<string, number>),
  //     statusBreakdown: data.reduce((acc, intervention) => {
  //       acc[intervention.status] = (acc[intervention.status] || 0) + 1;
  //       return acc;
  //     }, {} as Record<string, number>),
  //     captureModeBreakdown: data.reduce((acc, intervention) => {
  //       acc[intervention.captureMode] = (acc[intervention.captureMode] || 0) + 1;
  //       return acc;
  //     }, {} as Record<string, number>),
  //     totalTreesPlanted: data.reduce((acc, intervention) => acc + (intervention.treesPlanted || 0), 0),
  //     totalSampleTrees: data.reduce((acc, intervention) => acc + (intervention.sampleTreeCount || 0), 0),
  //     privateInterventions: data.filter(i => i.isPrivate).length,
  //     recentInterventions: data.slice(0, 5), // Last 5 interventions
  //   };

  //   return stats;
  // }
}