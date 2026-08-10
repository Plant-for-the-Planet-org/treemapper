import { Controller, Post, Get, Delete, UseGuards, Req, HttpException, HttpStatus, Headers, Query } from '@nestjs/common';
import { MigrationCheckResult, MigrationService } from './migrate.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { SuperAdminGuard } from 'src/auth/super-admin.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('migration')
@UseGuards(JwtAuthGuard)
export class MigrationController {
    constructor(
        private readonly migrationService: MigrationService) { }

    @Post('start')
    async startMigration(@CurrentUser() userData: User) {
        this.migrationService.startUserMigration(
            userData.email,
        ).catch(error => {
            console.error('Migration failed:', error);
        });

        return {
            currentStep: "in_progress",
            updatedAt: Date.now(),
            userMigrated: false,
            projectMigrated: false,
            speciesMigrated: false,
            sitesMigrated: false,
            interventionMigrated: false,
            imagesMigrated: false
        };
    }

    @Get('check')
    async checkMigrationStatus(
        @Headers('authorization') authorization: string,
        @Req() req: any,
    ): Promise<MigrationCheckResult> {
        if (!authorization) {
            throw new HttpException(
                'Authorization header is required',
                HttpStatus.UNAUTHORIZED
            );
        }
        return await this.migrationService.checkUserInttc(authorization, req.user.id);
    }

    @Get('status')
    async getMigrationStatus(@Req() req) {
        return await this.migrationService.getMigrationStatus(req.user.id);
    }

    // Look up any user's migration status by email. This crosses user
    // boundaries, so it is restricted to superadmin (no product caller today).
    @Get('status-by-email')
    @UseGuards(SuperAdminGuard)
    async getMigrationStatusByEmail(@Query('email') email: string) {
        if (!email) {
            throw new HttpException('email query param required', HttpStatus.BAD_REQUEST);
        }
        return await this.migrationService.getMigrationStatusByEmail(email);
    }

    @Delete('interventions')
    async resetInterventions(@CurrentUser() userData: User) {
        await this.migrationService.resetInterventionMigration(userData.id);
        return { message: 'Intervention migration data cleared. You can now retry migration.' };
    }
}