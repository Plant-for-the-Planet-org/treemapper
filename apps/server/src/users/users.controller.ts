import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AvatarDTO, CreateSurvey } from './dto/create-user.dto';
import { CreateDeviceDto } from './dto/create-device.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ExtendedUser, User } from './entities/user.entity';
import { CreatePresignedUrlDto } from './dto/signed-url.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserRateLimit, UserRateLimitGuard } from '../common/guards/user-rate-limit.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) { }
  @Get('me')
  async getProfile(@CurrentUser() users: ExtendedUser) {
    return {
      uid: users.uid,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
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
      primaryWorkspaceUid: users.primaryWorkspaceUid,
      primaryProjectUid: users.primaryProjectUid,
      workspace: users.workspaceRole,
      impersonated: users.impersonated ? true : false
    }
  }

  @Put('avatar')
  async updateUserAvatar(@Body() avatarDto: AvatarDTO, @CurrentUser() user: User,) {
    return await this.usersService.updateUserAvatar(avatarDto, user);
  }


  @Post('onboarding')
  async onBoardUser(@Body() createSurveyDto: CreateSurvey, @CurrentUser() user: User,) {
    return await this.usersService.onBoardUser(createSurveyDto, user);
  }


  @Post('presign-url')
  async getSignedUrl(
    @Body() dto: CreatePresignedUrlDto,
    @CurrentUser() user: User) {
    return await this.usersService.generateR2Url(dto);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return await this.usersService.update(user.id, updateProfileDto);
  }

  @Post('invalidate/cache')
  async invalidateMyCache(@CurrentUser() user: User,) {
    return await this.usersService.invalidateMyCache(user);
  }

  // Every row here is keyed on a deviceId the client picks, so an unthrottled
  // caller can grow the table one row per request. The ceiling is deliberately
  // far above real use: the app registers on login and on every foreground, and
  // a foreground happens each time the camera or maps hands control back, so a
  // tight limit would throttle ordinary field work. 300/hour still caps a loop
  // hard. Going over is harmless for the user (the app reports the failure and
  // retries on the next open), so it only ever costs stale telemetry.
  @Post('devices')
  @UseGuards(UserRateLimitGuard)
  @UserRateLimit({ limit: 300, windowMs: 60 * 60 * 1000, name: 'device-register' })
  async registerDevice(
    @Body() createDeviceDto: CreateDeviceDto,
    @CurrentUser() user: User,
  ) {
    return await this.usersService.registerOrUpdateDevice(user.id, createDeviceDto);
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