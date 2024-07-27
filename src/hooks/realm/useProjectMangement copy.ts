import {useRealm, Realm} from '@realm/react'
import {RealmSchema} from 'src/types/enum/db.enum'

const useProjectMangement = () => {
  const realm = useRealm()

  const addAllProjects = async (projectData: any[]): Promise<boolean> => {
    try {
      realm.write(() => {
        projectData.forEach((project: any) => {
          const {properties} = project
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
        return Promise.resolve(true)
      })
      return Promise.resolve(true)
    } catch (error) {
      console.error('Error while adding projects', error)
 return false
    }
  }

  return {addAllProjects}
}

export default useProjectMangement
