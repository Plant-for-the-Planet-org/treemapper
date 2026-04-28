'use client'

import ProjectInviteModal from "@/component/ProjectInviteModal"
import Overview from "./overview/component/Overview"
import userProjectStore from  "@shared-core/store/useProjectStore"

export default function page() {
  const selectedProject = userProjectStore(state=> state.selectedProject)
  if(!selectedProject){
    return null
  }
  return (
    <>
      <ProjectInviteModal />
      <Overview />
    </>
  )

}