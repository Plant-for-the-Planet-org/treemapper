import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { ProjectSpeciesService } from '../services/project-species.service';
import { CreateUserSpeciesDto, UpdateUserSpeciesDto, UserSpeciesFilterDto } from '../dto/user-species.dto';
import { ProjectPermissionsGuard } from '../../projects/guards/project-permissions.guard';
import { ProjectRoles } from '../../projects/decorators/project-roles.decorator';
import { Membership } from '../../projects/decorators/membership.decorator';
import { ProjectGuardResponse } from '../../projects/projects.service';




@Controller('project-species')
export class ProjectSpeciesController {
  constructor(private readonly userSpeciesService: ProjectSpeciesService) { }

  @Post('/:id')
  @ProjectRoles('owner', 'admin', 'contributor', 'observer')
  @UseGuards(ProjectPermissionsGuard)
  async create(
    @Membership() membership: ProjectGuardResponse,
    @Body() createDto: CreateUserSpeciesDto
  ) {
    return this.userSpeciesService.create(
      membership,
      createDto,
    );
  }

  @Get('/:id')
  @ProjectRoles('owner', 'admin', 'contributor', 'observer')
  @UseGuards(ProjectPermissionsGuard)
  async getAll(
    @Membership() membership: ProjectGuardResponse,
  ) {
    return this.userSpeciesService.getProjectSpeciesAggregated(membership.projectId);
  }

  @Put('/:id/species/:species/fav')
  @ProjectRoles('owner', 'admin', 'contributor', 'observer')
  @UseGuards(ProjectPermissionsGuard)
  async updateFavourite(
    @Param('species') species: string,
    @Membership() membership: ProjectGuardResponse,
    @Body() updateDto: { fav: boolean },
  ) {
    return this.userSpeciesService.updateFavourite(
      species,
      membership,
      updateDto,
    );
  }

  @Put('/:id/species/:species/disable')
  @ProjectRoles('owner', 'admin', 'contributor', 'observer')
  @UseGuards(ProjectPermissionsGuard)
  async updateDisbale(
    @Param('species') species: string,
    @Membership() membership: ProjectGuardResponse,
    @Body() updateDto: { disable: boolean },
  ) {
    return this.userSpeciesService.updateDisbale(
      species,
      membership,
      updateDto,
    );
  }

  @Put('/:id/species/:species')
  @ProjectRoles('owner', 'admin', 'contributor', 'observer')
  @UseGuards(ProjectPermissionsGuard)
  async update(
    @Param('species') species: string,
    @Membership() membership: ProjectGuardResponse,
    @Body() updateDto: UpdateUserSpeciesDto,
  ) {
    return this.userSpeciesService.update(
      species,
      membership,
      updateDto,
    );
  }

  // @Delete('/:id/species/:species')
  // @ProjectRoles('owner', 'admin', 'contributor')
  // @UseGuards(ProjectPermissionsGuard)
  // async delete(
  //   @Param('species') species: string,
  //   @Membership() membership: ProjectGuardResponse,
  // ) {
  //   return this.userSpeciesService.delete(species, membership);
  // }




  // // @Get(':id')
  // // // @ProjectRoles('owner', 'admin', 'manager', 'contributor', 'observer', 'researcher')
  // // // @UseGuards(ProjectPermissionsGuard)
  // // @ApiOperation({ summary: 'Get user species by ID' })
  // // @ApiResponse({ status: 200, description: 'User species retrieved successfully' })
  // // async getById(
  // //   @Param('id', ParseIntPipe) id: number,
  // //   @Req() req: any,
  // // ) {
  // //   return this.userSpeciesService.getById(id, req.user.id, req.project.id);
  // // }

  // // @Put(':id')
  // // // @ProjectRoles('owner', 'admin', 'manager', 'contributor')
  // // // @UseGuards(ProjectPermissionsGuard)
  // // @UseInterceptors(FileInterceptor('image'))
  // // @ApiConsumes('multipart/form-data')
  // // @ApiOperation({ summary: 'Update user species' })
  // // @ApiResponse({ status: 200, description: 'Species updated successfully' })
  // // async update(
  // //   @Param('id', ParseIntPipe) id: number,
  // //   @Body() updateDto: UpdateUserSpeciesDto,
  // //   @Req() req: any,
  // // ) {
  // //   return this.userSpeciesService.update(
  // //     id,
  // //     req.user.id,
  // //     req.project.id,
  // //     updateDto,
  // //   );
  // // }

  // // @Patch(':id/favourite')
  // // // @ProjectRoles('owner', 'admin', 'manager', 'contributor')
  // // // @UseGuards(ProjectPermissionsGuard)
  // // @ApiOperation({ summary: 'Toggle species favourite status' })
  // // @ApiResponse({ status: 200, description: 'Favourite status updated successfully' })
  // // async updateFavourite(
  // //   @Param('id', ParseIntPipe) id: number,
  // //   @Body('favourite') favourite: boolean,
  // //   @Req() req: any,
  // // ) {
  // //   return this.userSpeciesService.updateFavourite(
  // //     id,
  // //     req.user.id,
  // //     req.project.id,
  // //     favourite,
  // //   );
  // // }



  // // @Post()

  // // // @UseInterceptors(FileInterceptor('image'))
  // // // @ApiConsumes('multipart/form-data')
  // // // @ApiOperation({ summary: 'Add species to user collection' })
  // // // @ApiResponse({ status: 201, description: 'Species added successfully' })
  // // @ProjectRoles('owner', 'admin')
  // // @UseGuards(ProjectPermissionsGuard)
  // // async create(
  // //   @Membership() membership: ProjectGuardResponse,
  // //   @Body() createDto: CreateUserSpeciesDto
  // // ) {
  // //   return this.userSpeciesService.create(
  // //     membership,
  // //     createDto,
  // //   );
  // // }
}
