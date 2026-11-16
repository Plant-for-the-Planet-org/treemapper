import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectRoles } from '../projects/decorators/project-roles.decorator';
import { ProjectPermissionsGuard } from '../projects/guards/project-permissions.guard';
import { Membership } from '../projects/decorators/membership.decorator';
import { ProjectGuardResponse } from '../projects/projects.service';
import { LandmarksService } from './landmarks.service';
import { CreateLandmarkDto, UpdateLandmarkDto } from './dto/landmark.dto';

@Controller('projects/:id/landmarks')
@UseGuards(JwtAuthGuard)
export class LandmarksController {
  constructor(private readonly landmarksService: LandmarksService) { }

  // Read is open to every project member so the mobile app and the overview
  // map can show landmarks to contributors and observers alike.
  @Get()
  @ProjectRoles('owner', 'admin', 'contributor', 'observer')
  @UseGuards(ProjectPermissionsGuard)
  async getLandmarks(@Membership() membership: ProjectGuardResponse) {
    return this.landmarksService.getLandmarks(membership.projectId);
  }

  @Post()
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async createLandmark(
    @Membership() membership: ProjectGuardResponse,
    @Body() dto: CreateLandmarkDto,
  ) {
    return this.landmarksService.createLandmark(membership, dto);
  }

  @Patch(':landmarkUid')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async updateLandmark(
    @Membership() membership: ProjectGuardResponse,
    @Param('landmarkUid') landmarkUid: string,
    @Body() dto: UpdateLandmarkDto,
  ) {
    return this.landmarksService.updateLandmark(membership.projectId, landmarkUid, dto);
  }

  @Delete(':landmarkUid')
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  async deleteLandmark(
    @Membership() membership: ProjectGuardResponse,
    @Param('landmarkUid') landmarkUid: string,
  ) {
    return this.landmarksService.deleteLandmark(membership.projectId, landmarkUid);
  }
}
