import { Module } from '@nestjs/common';
import { MobileService } from './mobile.service';
import { MobileController } from './mobile.controller';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from 'src/projects/projects.module';
import { UsersModule } from 'src/users/users.module';
import { MigrationModule } from 'src/migrate/migrate.module.ts';
import { EmailModule } from 'src/email/email.module';

@Module({
    imports: [DatabaseModule, ProjectsModule, UsersModule, MigrationModule, EmailModule],
    controllers: [MobileController],
    providers: [MobileService],
    exports: [MobileService],
})
export class MobileModule { }
