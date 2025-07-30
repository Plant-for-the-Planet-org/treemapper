// // src/organizations/organizations.controller.ts
// import {
//   Controller,
//   Get,
//   Post,
//   Body,
//   UseGuards,
//   Req,
//   HttpStatus,
//   HttpCode,
//   ValidationPipe,
// } from '@nestjs/common';
// import {
//   ApiTags,
//   ApiOperation,
//   ApiResponse,
//   ApiBearerAuth,
//   ApiBody,
// } from '@nestjs/swagger';
// import { Request } from 'express';
// import { OrganizationsService } from './organization.service';
// import { CreateOrganizationDto } from './dto/create-organization.dto';
// import { OrganizationResponseDto, SelectOrganizationDto, UserOrganizationResponseDto } from './dto/organization-response.dto';
// // Assuming you have these guards - adjust import paths as needed
// // import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// interface AuthenticatedRequest extends Request {
//   user: {
//     id: number;
//     uid: string;
//     email: string;
//     auth0Id: string
//   };
// }

// @ApiTags('Organizations')
// @Controller('organizations')
// // @ProjectRoles('owner', 'admin', 'contributor')
// // @UseGuards(ProjectPermissionsGuard)
// @ApiBearerAuth()
// export class OrganizationsController {
//   constructor(private readonly organizationsService: OrganizationsService) { }

//   @Post()
//   async create(
//     @Body(ValidationPipe) createOrganizationDto: CreateOrganizationDto,
//     @Req() req: AuthenticatedRequest,
//   ): Promise<OrganizationResponseDto> {
//     return this.organizationsService.create(createOrganizationDto, req.user.id);
//   }


//   @Post('/primary')
//   async selectOrg(
//     @Body(ValidationPipe) createOrganizationDto: SelectOrganizationDto,
//     @Req() req: AuthenticatedRequest,
//   ): Promise<any> {
//     return this.organizationsService.selectOrg(createOrganizationDto, req.user.id, req.user.auth0Id, req.user);
//   }

//   @Get()
//   async findAllByUser(@Req() req: AuthenticatedRequest): Promise<UserOrganizationResponseDto[]> {
//     return this.organizationsService.findAllByUser(req.user.id);
//   }

//   // Additional endpoints you might want to add later:

//   // @Get(':uid')
//   // @ApiOperation({
//   //   summary: 'Get organization by UID',
//   //   description: 'Returns organization details by UID'
//   // })
//   // @ApiResponse({
//   //   status: HttpStatus.OK,
//   //   description: 'Organization found',
//   //   type: OrganizationResponseDto,
//   // })
//   // @ApiResponse({
//   //   status: HttpStatus.NOT_FOUND,
//   //   description: 'Organization not found',
//   // })
//   // async findByUid(@Param('uid') uid: string): Promise<OrganizationResponseDto> {
//   //   return this.organizationsService.findByUid(uid);
//   // }
// }