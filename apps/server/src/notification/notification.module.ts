
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { DatabaseModule } from '../database/database.module';
import { NotificationController } from './notification.controller';
import { NotificationRepository } from './notification.repository';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [NotificationController],
  providers: [ NotificationService, NotificationRepository],
  exports: [NotificationService],
})
export class NotificationModule { }
