import { Controller, Get, Post, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProjectRoles } from './decorators/project-roles.decorator';
import { ProjectPermissionsGuard } from './guards/project-permissions.guard';
import { Membership } from './decorators/membership.decorator';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { ProjectApiKeyService } from './project-api-key.service';

@ApiTags('Project API Keys')
@Controller('projects')
export class ProjectApiKeyController {
  constructor(private readonly projectApiKeyService: ProjectApiKeyService) {}

  @Get(':projectUid/api-key')
  @ApiOperation({ summary: 'Get API key status for a project (never returns the key)' })
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  getApiKey(@Membership() membership: any) {
    return this.projectApiKeyService.getStatus(membership.projectId);
  }

  @Post(':projectUid/api-key')
  @ApiOperation({ summary: 'Generate or regenerate the project API key (returns plaintext once)' })
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  generateApiKey(@Membership() membership: any, @CurrentUser() user: User) {
    return this.projectApiKeyService.generate(membership.projectId, user.id);
  }

  @Delete(':projectUid/api-key')
  @ApiOperation({ summary: 'Revoke the project API key' })
  @ProjectRoles('owner', 'admin')
  @UseGuards(ProjectPermissionsGuard)
  revokeApiKey(@Membership() membership: any) {
    return this.projectApiKeyService.revoke(membership.projectId);
  }
}
