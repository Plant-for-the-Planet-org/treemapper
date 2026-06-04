import { useCallback } from 'react'
import { useRealm, Realm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { ProjectInterface } from 'src/types/interface/app.interface'

const useProjectManagement = () => {
  const realm = useRealm()

  // Reconciles local Realm projects with the latest API response.
  // - Projects in the response are created (new) or updated in place. We use
  //   UpdateMode.Modified so the existing record's identity is kept and only
  //   the detail fields change; the primary key (server id) is never altered.
  // - The sites array is rebuilt from the response, so a site the user lost
  //   access to drops off the project.
  // - Projects present in Realm but absent from the response were removed on
  //   the server (project deleted, or the user lost access) and are deleted.
  // - Site rows no longer linked to any project are cleaned up to avoid orphans.
  // NOTE: only call this with an authoritative response. An empty array means
  // "the account has zero projects" and will clear all local projects. A failed
  // or offline fetch must be handled by the caller and must not reach here.
  const addAllProjects = useCallback(async (projectData: any[]): Promise<boolean> => {
    try {
      realm.write(() => {
        const responseProjectIds = new Set<string>()
        const responseSiteIds = new Set<string>()

        projectData.forEach((project: any) => {
          const { properties } = project
          responseProjectIds.add(properties.id)

          const sites = []
          for (const site of properties.sites) {
            responseSiteIds.add(site.id)
            sites.push({
              ...site,
              geometry: JSON.stringify(site.geometry),
            })
          }

          const mappedProject: any = {
            allowDonations: properties.allowDonations,
            countPlanted: properties.countPlanted || 0,
            countTarget: properties.countTarget || 1,
            country: properties.country || '',
            currency: properties.currency || '',
            id: properties.id,
            image: properties.image ? properties.image : '',
            name: properties.name,
            slug: properties.slug,
            treeCost: properties.treeCost,
            sites,
            geometry: project.geometry !== null ? JSON.stringify(project.geometry) : '',
            purpose: properties.purpose,
            intensity: properties.intensity || 0,
            frequency: properties.revisionPeriodicityLevel || 'low',
          }

          realm.create(
            RealmSchema.Projects,
            mappedProject,
            Realm.UpdateMode.Modified,
          )
        })

        // Delete projects that are no longer returned by the server.
        const staleProjects = realm
          .objects<ProjectInterface>(RealmSchema.Projects)
          .filtered('NOT id IN $0', Array.from(responseProjectIds))
        realm.delete(staleProjects)

        // Delete site rows no longer linked to any project (removed sites and
        // sites that belonged to deleted projects).
        const staleSites = realm
          .objects(RealmSchema.ProjectSite)
          .filtered('NOT id IN $0', Array.from(responseSiteIds))
        realm.delete(staleSites)
      })
      return true
    } catch (error) {
      return false
    }
  }, [realm])


  const deleteAllProjects = useCallback(async (): Promise<boolean> => {
    try {
      realm.write(() => {
        const unSyncedObjects = realm.objects(RealmSchema.Projects);
        realm.delete(unSyncedObjects);
      });
      return true
    } catch (error) {
      return false;
    }
  }, [realm]);


  const updateProjectInF = useCallback(async (pID: string, f: string, i: number): Promise<boolean> => {
    try {
      realm.write(() => {
        const projectDetails = realm.objectForPrimaryKey<ProjectInterface>(RealmSchema.Projects, pID);
        projectDetails.frequency = f
        projectDetails.intensity = i
      });
      return true
    } catch (error) {
      return false;
    }
  }, [realm]);

  const addNewSite = useCallback(async (projectID: string, siteData: any): Promise<boolean> => {
    try {
      realm.write(() => {
        const projectData = realm.objectForPrimaryKey<ProjectInterface>(RealmSchema.Projects, projectID)
        const existingSites = [...projectData.sites]
        existingSites.push(siteData)
        projectData.sites = existingSites
      })
      return true
    } catch (error) {
      return false
    }
  }, [realm])

  return { addAllProjects, deleteAllProjects, updateProjectInF, addNewSite }
}

export default useProjectManagement
