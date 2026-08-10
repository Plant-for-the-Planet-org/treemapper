import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard';
import { ProjectRoles } from 'src/projects/decorators/project-roles.decorator';
import { ProjectPermissions } from 'src/projects/decorators/project-permissions.decorator';
import { Membership } from 'src/projects/decorators/membership.decorator';
import { ProjectGuardResponse } from 'src/projects/projects.service';
import { FormsService } from './forms.service';
import { CreateFormDto, UpdateFormDto, QueryFormsDto } from './dto/form.dto';

// Forms are project-scoped. Writes need owner/admin (or the `manage_form`
// extra permission); reads are open to any project member. Contributors can
// read but the web sidebar hides the Forms nav from them.
@ApiTags('Forms')
@ApiBearerAuth()
@Controller('projects/:projectId/forms')
@UseGuards(JwtAuthGuard)
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  @ProjectRoles('owner', 'admin', 'contributor', 'observer')
  @UseGuards(ProjectPermissionsGuard)
  @ApiOperation({ summary: 'List forms for a project' })
  @ApiResponse({ status: 200, description: 'Returns the project forms' })
  async listForms(
    @Param('projectId') projectUid: string,
    @Membership() membership: ProjectGuardResponse,
    @Query() query: QueryFormsDto,
  ) {
    return this.formsService.listForms(membership, projectUid, query);
  }

  @Get(':formUid')
  @ProjectRoles('owner', 'admin', 'contributor', 'observer')
  @UseGuards(ProjectPermissionsGuard)
  @ApiOperation({ summary: 'Get a single form' })
  @ApiResponse({ status: 200, description: 'Returns the form' })
  async getForm(
    @Param('projectId') projectUid: string,
    @Param('formUid') formUid: string,
    @Membership() membership: ProjectGuardResponse,
  ) {
    return this.formsService.getForm(membership, projectUid, formUid);
  }

  @Post()
  @ProjectRoles('owner', 'admin')
  @ProjectPermissions('manage_form')
  @UseGuards(ProjectPermissionsGuard)
  @ApiOperation({ summary: 'Create a form' })
  @ApiResponse({ status: 201, description: 'Form created' })
  async createForm(
    @Param('projectId') projectUid: string,
    @Body() dto: CreateFormDto,
    @Membership() membership: ProjectGuardResponse,
  ) {
    return this.formsService.createForm(membership, projectUid, dto);
  }

  @Patch(':formUid')
  @ProjectRoles('owner', 'admin')
  @ProjectPermissions('manage_form')
  @UseGuards(ProjectPermissionsGuard)
  @ApiOperation({ summary: 'Update a form (name, description, status, schema)' })
  @ApiResponse({ status: 200, description: 'Form updated' })
  async updateForm(
    @Param('projectId') projectUid: string,
    @Param('formUid') formUid: string,
    @Body() dto: UpdateFormDto,
    @Membership() membership: ProjectGuardResponse,
  ) {
    return this.formsService.updateForm(membership, projectUid, formUid, dto);
  }

  @Delete(':formUid')
  @ProjectRoles('owner', 'admin')
  @ProjectPermissions('manage_form')
  @UseGuards(ProjectPermissionsGuard)
  @ApiOperation({ summary: 'Delete a form (soft delete)' })
  @ApiResponse({ status: 200, description: 'Form deleted' })
  async deleteForm(
    @Param('formUid') formUid: string,
    @Membership() membership: ProjectGuardResponse,
  ) {
    return this.formsService.deleteForm(membership, formUid);
  }
}
