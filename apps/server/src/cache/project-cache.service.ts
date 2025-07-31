import { Injectable } from "@nestjs/common";
import { CacheService } from "./cache.service";
import { CACHE_KEYS, CACHE_TTL } from "./cache-keys";
import { ProjectGuardResponse } from "src/projects/projects.service";

@Injectable()
export class ProjectCacheService {
    constructor(private cacheService: CacheService) { }

    private getUserProjectKey(identifier: string): string {
        return CACHE_KEYS.PROJECT.BY_PID_UID(identifier)
    }

    async getUserProject(projectId: string, userId: number): Promise<ProjectGuardResponse | null> {
        return this.cacheService.get(this.getUserProjectKey(`${projectId}-${userId}`));
    }

    async setUserProject(projectId: string, userId: number, data: ProjectGuardResponse): Promise<void> {
        await this.cacheService.set(this.getUserProjectKey(`${projectId}-${userId}`), data, CACHE_TTL.MEDIUM);
    }


    async refreshWorspaceId(workspaceUid: string, workspaceId: number): Promise<void> {
       try{
        console.log(`Refreshing workspace ID for ${workspaceUid} to ${workspaceId}`);
         await this.cacheService.delete(`work:${workspaceUid}`)
        await this.cacheService.set(`work:${workspaceUid}`, workspaceId, CACHE_TTL.FOREVER);
       }catch (error) {
           console.error(`Error refreshing workspace ID for ${workspaceUid}:`, error);
       }
    }

    async getWorkspaceId(workspaceUid: string): Promise<number | null> {
        return this.cacheService.get(`work:${workspaceUid}`);
    }

    async clearServerCache(){
        return this.cacheService.reset()
    }

    // async refreshAuthUser(user: User): Promise<void> {
    //     await this.cacheService.delete(this.getUseAuthrKey(user.auth0Id));
    //     await this.cacheService.set(this.getUseAuthrKey(user.auth0Id), user, CACHE_TTL.MEDIUM);
    // }

    // async invalidateUser(user: User): Promise<void> {
    //     await this.cacheService.delete(this.getUseAuthrKey(user.auth0Id));
    // }
}