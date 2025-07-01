import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SpeciesRequestService } from '../services/species-request.service';
import { CreateSpeciesRequestDto, SpeciesRequestFilterDto } from '../dto/species-request.dto';
import { ProjectPermissionsGuard } from '../../projects/guards/project-permissions.guard';
import { ProjectRoles } from '../../projects/decorators/project-roles.decorator';
import { Membership } from 'src/projects/decorators/membership.decorator';

@ApiTags('Species Requests')
@Controller('species-requests')
export class SpeciesRequestController {
  constructor(private readonly speciesRequestService: SpeciesRequestService) { }

  @Post('/:id')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async createRequest(
    @Body() createDto: CreateSpeciesRequestDto,
    @Membership() membership: any,
  ) {
    return this.speciesRequestService.createRequest(
      membership.userId,
      membership.projectId,
      createDto,
    );
  }

    @Get()
    @ApiOperation({ summary: 'Get all species requests (Super Admin only)' })
    @ApiResponse({ status: 200, description: 'Species requests retrieved successfully' })
    async getRequests(@Query() filterDto: SpeciesRequestFilterDto) {
      // Note: Add superadmin check in your authentication middleware
      return this.speciesRequestService.getRequests(filterDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get species request by ID' })
    @ApiResponse({ status: 200, description: 'Species request retrieved successfully' })
    async getRequestById(@Param('id') id: number) {
      return this.speciesRequestService.getRequestById(id);
    }
}
