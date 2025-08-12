// src/organizations/organizations.controller.ts
import {
    Controller,
    Get,
    Post,
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
import { OrganizationResponseDto, SelectOrganizationDto, UserOrganizationResponseDto } from './dto/organization-response.dto';
import { User } from 'src/users/entities/user.entity';
import { CurrentUser } from 'src/auth/current-user.decorator';


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
    constructor(private readonly workspaceService: WorkspaceService) { }
    @Post()
    async createNewWorkspace(
        @Body() createOrganizationDto: CreateNewWorkspaceDto,
        @Req() req: any,
    ): Promise<Boolean> {
        if (req.user.type !== 'superadmin') {
            throw new HttpException('Only superadmin can create new workspace', HttpStatus.FORBIDDEN);
        }
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
    async clearServerCache(@CurrentUser() user: User,) {
        if (user.type !== 'superadmin') {
            throw 'Not permitted'
        }
        return await this.workspaceService.clearServerCache(user);
    }

    @Post('cache/refresh')
    async refreshWorkspace(@CurrentUser() user: User,) {
        if (user.type !== 'superadmin') {
            throw 'Not permitted'
        }
        return await this.workspaceService.cacheWorkspace();
    }


    @Get('/members')
    async findUsers(@CurrentUser() user: User): Promise<any[]> {
        return await this.workspaceService.findUsers(user);
    }

    @Put('/impersonate/:person')
    async impoersonateUser(@Param('person') person: string, @CurrentUser() user: User): Promise<boolean> {
        return await this.workspaceService.startImpersonation(person, user);
    }

    @Put('/impersonate/exit')
    async impoersonateUserExit(@CurrentUser() user: User): Promise<boolean> {
        return await this.workspaceService.impersonationexit(user);
    }
}