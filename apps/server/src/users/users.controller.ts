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
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  NotFoundException,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AvatarDTO, CreateSurvey, CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from './entities/user.entity';
import { CreatePresignedUrlDto } from './dto/signed-url.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  async getProfile(@CurrentUser() users: User) {
    return {
      uid: users.uid,
      email: users.email,
      firstname: users.firstname,
      lastname: users.lastname,
      displayName: users.displayName,
      image: users.image,
      slug: users.slug,
      type: users.type,
      country: users.country,
      url: users.website,
      isPrivate: users.isPrivate,
      bio: users.bio,
      locale: users.locale,
      isActive: users.isActive,
      migratedAt: users.migratedAt,
      existingPlanetUser: users.existingPlanetUser,
      primaryWorkspace: users.primaryWorkspace,
      primaryProject: users.primaryProject
    }
  }


  @Post('onboarding')
  async onBoardUser(@Body() createSurveyDto: CreateSurvey, @CurrentUser() user: User,) {
    return await this.usersService.onBoardUser(createSurveyDto, user);
  }

  @Put('avatar')
  async updateUserAvatar(@Body() avatarDto: AvatarDTO, @CurrentUser() user: User,) {
    return await this.usersService.updateUserAvatar(avatarDto.avatarUrl, user);
  }


  //   // @ApiExcludeEndpoint()
  //   @Put('migrated')
  //   async migrated(@CurrentUser() user: User) {
  //     return await this.usersService.migrateSuccess(user.id);
  //   }

  @Post('presign-url')
  async getSignedUrl(
    @Body() dto: CreatePresignedUrlDto,
    @CurrentUser() user: User) {
    return await this.usersService.generateR2Url(dto);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: any,
  ) {
    return await this.usersService.update(user.id, updateUserDto);
  }




  //   @Get('stats')
  //   async getStats() {
  //     return await this.usersService.getUserStats();
  //   }

  //   @Get('check-email')
  //   async checkEmail(@Query('email') email: string) {
  //     const exists = await this.usersService.checkEmailExists(email);
  //     return { exists };
  //   }

  //   @Get('by-guid/:guid')
  //   async findByGuid(@Param('guid') guid: string) {
  //     return await this.usersService.findByuid(guid);
  //   }

  //   @Get(':id')
  //   async findOne(@Param('id', ParseIntPipe) id: number) {
  //     return await this.usersService.findOne(id);
  //   }


  //   @Patch(':id')
  //   async update(
  //     @Param('id', ParseIntPipe) id: number,
  //     @Body() updateUserDto: UpdateUserDto,
  //   ) {
  //     return await this.usersService.update(id, updateUserDto);
  //   }

  //   @Patch(':id/deactivate')
  //   async deactivate(@Param('id', ParseIntPipe) id: number) {
  //     return await this.usersService.deactivate(id);
  //   }

  //   @Patch(':id/activate')
  //   async activate(@Param('id', ParseIntPipe) id: number) {
  //     return await this.usersService.activate(id);
  //   }



  //   @Delete(':id')
  //   @HttpCode(HttpStatus.OK)
  //   async remove(@Param('id', ParseIntPipe) id: number) {
  //     return await this.usersService.remove(id);
  //   }

  //   @Delete(':id/hard')
  //   @HttpCode(HttpStatus.OK)
  //   async hardDelete(@Param('id', ParseIntPipe) id: number) {
  //     return await this.usersService.hardDelete(id);
  //   }
}