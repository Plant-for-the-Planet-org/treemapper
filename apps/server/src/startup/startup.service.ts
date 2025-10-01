import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DrizzleService } from 'src/database/drizzle.service';
import { WorkspaceService } from 'src/workspace/workspace.service';

@Injectable()
export class StartupService implements OnApplicationBootstrap {
    constructor(
        private readonly drizzleService: DrizzleService,
        private readonly workspaceService: WorkspaceService

    ) { }

    async onApplicationBootstrap() {
        await this.ensureDatabaseReady();
        await this.initializeData();
    }

    private async ensureDatabaseReady() {
        let retries = 10;
        while (retries > 0) {
            try {
                // Test database connection using your DrizzleService
                await this.drizzleService.db.execute('SELECT 1');
                console.log('Database connection verified successfully');
                return;
            } catch (error) {
                console.log(`Database not ready, retrying... (${retries} attempts left)`);
                retries--;
                if (retries === 0) {
                    throw new Error(`Database connection failed after all retries: ${error.message}`);
                }
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            }
        }
    }

    async initializeData() {
        console.log("Database is ready - running startup tasks");
        try {
            this.workspaceService.cacheWorkspace()
        } catch (error) {
            console.error('Error during data initialization:', error);
        }
    }
}