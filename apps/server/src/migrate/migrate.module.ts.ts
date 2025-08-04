// import { Module } from '@nestjs/common';
// import { HttpModule } from '@nestjs/axios';
// import { MigrationService } from './migrate.service'
// import { MigrationController } from './migrate.controller'
// import { DatabaseModule } from '../database/database.module';
// import { UsersModule } from 'src/users/users.module';
// import { ProjectsModule } from 'src/projects/projects.module';
// import { NotificationModule } from 'src/notification/notification.module';

// @Module({
//   imports: [
//     HttpModule.register({
//       timeout: 30000,
//       maxRedirects: 5,
//     }),
//     DatabaseModule,
//     UsersModule,
//     ProjectsModule,
//     NotificationModule
//   ],
//   controllers: [MigrationController,],
//   providers: [MigrationService],
//   exports: [MigrationService]
// })
// export class MigrationModule { }