// src/modules/trees/trees.module.ts
import { Module } from '@nestjs/common';
import { TreesService } from './trees.service';
import { TreesController } from './trees.controller';
import { DatabaseModule } from '../database/database.module'; // Adjust import path

@Module({
  imports: [DatabaseModule],
  controllers: [TreesController],
  providers: [TreesService],
  exports: [TreesService],
})
export class TreesModule {}
