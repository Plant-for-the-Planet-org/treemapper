// src/organizations/organizations.controller.ts
import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    UseGuards,
    Req,
    HttpStatus,
    HttpCode,
    ValidationPipe,
    HttpException,
    Param,
    Put,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { WorkspaceService } from './workspace.service';
import { CreateNewWorkspaceDto } from './dto/create-organization.dto';
import { UpdateWorkspaceSettingsDto } from './dto/workspace-settings.dto';
import { OrganizationResponseDto, SelectOrganizationDto, UserOrganizationResponseDto } from './dto/organization-response.dto';
import { User } from 'src/users/entities/user.entity';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { UserCacheService } from 'src/cache/user-cache.service';
import { SuperAdminGuard } from 'src/auth/super-admin.guard';
import { ImpersonationGuard } from 'src/auth/impersonation.guard';


interface AuthenticatedRequest extends Request {
    user: {
        id: number;
        uid: string;
        email: string;
        auth0Id: string
    };
}

@Controller('workspace')
export class WorkspaceController {
    constructor(private readonly workspaceService: WorkspaceService,private readonly userCacheService: UserCacheService) { }
    @Post()
    @UseGuards(SuperAdminGuard)
    async createNewWorkspace(
        @Body() createOrganizationDto: CreateNewWorkspaceDto,
        @Req() req: any,
    ): Promise<Boolean> {
        return this.workspaceService.createNewWorkspace(createOrganizationDto, req.user.id);
    }



    @Post('/primary')
    async setPrimaryOrg(
        @Body() createOrganizationDto: SelectOrganizationDto,
        @CurrentUser() user: User,
    ): Promise<any> {
        return this.workspaceService.setPrimaryWorkspaceAndProject(createOrganizationDto, user);
    }





    @Post('cache/clear')
    @UseGuards(SuperAdminGuard)
    async clearServerCache(@CurrentUser() user: User,) {
        return await this.workspaceService.clearServerCache(user);
    }

    @Post('cache/refresh')
    @UseGuards(SuperAdminGuard)
    async refreshWorkspace(@CurrentUser() user: User,) {
        return await this.workspaceService.cacheWorkspace();
    }

    @Post('cache/user/clear')
    @UseGuards(SuperAdminGuard)
    async clearUserCache(
        @CurrentUser() user: User,
        @Body() userDetails: any,
    ) {
        return await this.userCacheService.userCacheClearService(userDetails.authID);
    }


    @Get('/all')
    async getAllWorkspaces() {
        return await this.workspaceService.getAllWorkspaces();
    }

    @Get('/my')
    async getMyWorkspaces(@CurrentUser() user: User): Promise<any[]> {
        return await this.workspaceService.getMyAdminWorkspaces(user.id);
    }

    @Get('/members')
    async findUsers(): Promise<any[]> {
        return await this.workspaceService.findUsers();
    }

    @Get('/:uid/members')
    async getWorkspaceMembers(@Param('uid') uid: string): Promise<any[]> {
        return await this.workspaceService.getWorkspaceMembers(uid);
    }

    @Get('/:uid/projects')
    async getWorkspaceProjects(@Param('uid') uid: string): Promise<any[]> {
        return await this.workspaceService.getWorkspaceProjects(uid);
    }

    @Patch('/:uid/projects/:projectUid/transfer')
    async transferProject(
        @Param('uid') uid: string,
        @Param('projectUid') projectUid: string,
        @Body() body: { targetWorkspaceUid: string },
        @CurrentUser() user: User,
    ) {
        return await this.workspaceService.transferProject(uid, projectUid, body.targetWorkspaceUid, user.id);
    }

    @Patch('/:uid/projects/:projectUid/status')
    async updateProjectStatus(
        @Param('uid') uid: string,
        @Param('projectUid') projectUid: string,
        @Body() body: { status: 'active' | 'in_review' | 'suspended' | 'disabled' },
        @CurrentUser() user: User,
    ) {
        return await this.workspaceService.updateProjectStatus(uid, projectUid, body.status, user.id);
    }

    @Get('/:uid/settings')
    async getWorkspaceSettings(@Param('uid') uid: string) {
        return await this.workspaceService.getWorkspaceSettings(uid);
    }

    @Patch('/:uid/settings')
    async updateWorkspaceSettings(
        @Param('uid') uid: string,
        @Body(new ValidationPipe({ whitelist: true })) body: UpdateWorkspaceSettingsDto,
        @CurrentUser() user: User,
    ) {
        return await this.workspaceService.updateWorkspaceSettings(uid, body, user.id);
    }

    @Get('/:uid')
    async getWorkspace(@Param('uid') uid: string) {
        return await this.workspaceService.findByUid(uid);
    }

    @Patch('/:uid')
    async updateWorkspace(@Param('uid') uid: string, @Body() body: any, @CurrentUser() user: User) {
        return await this.workspaceService.updateWorkspace(uid, body, user.id);
    }

    @Put('/impersonate/exit')
    async impersonateUserExit(@CurrentUser() user: User): Promise<boolean> {
        return await this.workspaceService.impersonationexit(user);
    }

    @Put('/impersonate/:person')
    @UseGuards(ImpersonationGuard)
    async impersonateUser(@Param('person') person: string, @CurrentUser() user: User): Promise<boolean> {
        return await this.workspaceService.startImpersonation(person, user);
    }
}