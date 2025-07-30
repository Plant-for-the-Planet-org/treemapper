// import { Controller, Post, Get, Param, Body, UseGuards, Req, HttpException, HttpStatus, Headers } from '@nestjs/common';
// import { MigrationCheckResult, MigrationService } from './migrate.service';
// import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

// @Controller('migration')
// @UseGuards(JwtAuthGuard)
// export class MigrationController {
//   constructor(
//     private readonly migrationService: MigrationService) { }

//   @Post('start')
//   async startMigration(@Body() body: { planetId: string }, @Req() req: any) {
//     const authToken = req.headers.authorization?.replace('Bearer ', '');

//     if (!authToken) {
//       throw new Error('Authorization token required');
//     }

//     this.migrationService.startUserMigration(
//       req.user.id,
//       body.planetId,
//       req.user.email,
//       authToken
//     ).catch(error => {
//       console.error('Migration failed:', error);
//     });

//     return {
//       currentStep: "in_progress",
//       updatedAt: Date.now(),
//       userMigrated: false,
//       projectMigrated: false,
//       speciesMigrated: false,
//       sitesMigrated: false,
//       interventionMigrated: false,
//       imagesMigrated: false
//     };
//   }

//   @Get('check')
//   async checkMigrationStatus(
//     @Headers('authorization') authorization: string,
//     @Req() req: any,
//   ): Promise<MigrationCheckResult> {
//     if (!authorization) {
//       throw new HttpException(
//         'Authorization header is required',
//         HttpStatus.UNAUTHORIZED
//       );
//     }
//     return await this.migrationService.checkUserInttc(authorization,req.user.id);
//   }

//   @Get('status')
//   async getMigrationStatus(@Req() req) {
//     return await this.migrationService.getMigrationStatus(req.user.id);
//   }
// }