import { useRealm, Realm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { ProjectInterface } from 'src/types/interface/app.interface'

const useProjectManagement = () => {
  const realm = useRealm()

  const addAllProjects = async (projectData: any[]): Promise<boolean> => {
    try {
      realm.write(() => {
        projectData.forEach((project: any) => {
          const { properties } = project
          const sites = []
          const projectData: any = {
            allowDonations: properties.allowDonations,
            countPlanted: properties.countPlanted || 0,
            countTarget: properties.countTarget || 1,
            country: properties.country,
            currency: properties.currency,
            id: properties.id,
            image: properties.image ? properties.image : '',
            name: properties.name,
            slug: properties.slug,
            treeCost: properties.treeCost,
            sites: [],
            geometry: JSON.stringify(project.geometry),
            purpose: properties.purpose,
            intensity: properties.intensity || 0,
            frequency: properties.revisionPeriodicityLevel || 'low',
          }

          for (const site of properties.sites) {
            sites.push({
              ...site,
              geometry: JSON.stringify(site.geometry),
            })
          }

          projectData.sites = sites

          realm.create(
            RealmSchema.Projects,
            projectData,
            Realm.UpdateMode.Modified,
          )
        })
      })
      return true
    } catch (error) {
      console.error('Error while adding projects', error)
      return false
    }
  }


  const deleteAllProjects = async (): Promise<boolean> => {
    try {
      realm.write(() => {
        const unSyncedObjects = realm.objects(RealmSchema.Projects);
        realm.delete(unSyncedObjects);
      });
      return true
    } catch (error) {
      console.error('Error during update:', error);
      return false;
    }
  };


  const updateProjectInF = async (pID: string, f: string, i: number): Promise<boolean> => {
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
  };

  const addNewSite = async (projectID: string, siteData: any): Promise<boolean> => {
    try {
      realm.write(() => {
        const projectData =  realm.objectForPrimaryKey<ProjectInterface>(RealmSchema.Projects,projectID)
        const existingSites = [...projectData.sites]
        existingSites.push(siteData)
        projectData.sites = existingSites
      })
      return true
    } catch (error) {
      console.error('Error while adding site', error)
      return false
    }
  }

  return { addAllProjects, deleteAllProjects, updateProjectInF, addNewSite }
}

export default useProjectManagement
