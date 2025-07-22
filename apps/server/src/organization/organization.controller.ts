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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { OrganizationsService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationResponseDto, UserOrganizationResponseDto } from './dto/organization-response.dto';
// Assuming you have these guards - adjust import paths as needed
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    uid: string;
    email: string;
  };
}

@ApiTags('Organizations')
@Controller('organizations')
// @ProjectRoles('owner', 'admin', 'contributor')
// @UseGuards(ProjectPermissionsGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new organization',
    description: 'Creates a new organization and automatically adds the creator as an owner',
  })
  @ApiBody({ type: CreateOrganizationDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Organization created successfully',
    type: OrganizationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Organization with this name already exists',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Organization with this name already exists' },
        error: { type: 'string', example: 'Conflict' },
        statusCode: { type: 'number', example: 409 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Unauthorized' },
        statusCode: { type: 'number', example: 401 },
      },
    },
  })
  async create(
    @Body(ValidationPipe) createOrganizationDto: CreateOrganizationDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.create(createOrganizationDto, req.user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all organizations for current user',
    description: 'Returns all organizations that the current user is a member of, including their role and membership details',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organizations retrieved successfully',
    type: [UserOrganizationResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Unauthorized' },
        statusCode: { type: 'number', example: 401 },
      },
    },
  })
  async findAllByUser(@Req() req: AuthenticatedRequest): Promise<UserOrganizationResponseDto[]> {
    return this.organizationsService.findAllByUser(req.user.id);
  }

  // Additional endpoints you might want to add later:

  // @Get(':uid')
  // @ApiOperation({
  //   summary: 'Get organization by UID',
  //   description: 'Returns organization details by UID'
  // })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Organization found',
  //   type: OrganizationResponseDto,
  // })
  // @ApiResponse({
  //   status: HttpStatus.NOT_FOUND,
  //   description: 'Organization not found',
  // })
  // async findByUid(@Param('uid') uid: string): Promise<OrganizationResponseDto> {
  //   return this.organizationsService.findByUid(uid);
  // }
}