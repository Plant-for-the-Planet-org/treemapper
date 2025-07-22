import { Module } from '@nestjs/common';
import { MobileService } from './mobile.service';
import { MobileController } from './mobile.controller';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from 'src/projects/projects.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [DatabaseModule, ProjectsModule, UsersModule],
  controllers: [MobileController],
  providers: [MobileService],
  exports: [MobileService],
})
export class MobileModule { }
