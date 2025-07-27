'use client'

import React, { useState } from 'react'
import { useEffect } from "react";
import { useUserStore } from "@shared-core/store/useUserStore";
import { createNewPersonalProject, getMyDetails, getMyProjects, getMyWorkspaceProjects } from "@shared-core/fetchApi/api.fetch";
import { useToken } from "@/context/useTokenContext";
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';
import Spinner from '@/component/Spinner';
import { ProjectWithUserRoleI } from '@shared-core/types/interface.app';
import { sortProjects } from '@shared-core/utils/sortProjects';
import NoProjectSelected from '@/component/NoProjectPlaceHolder';
import useProjectStore from '@shared-core/store/useProjectStore';
import ErrorLoadingProject from '@/component/ProjectErrorPlaceholder';

export default function page() {

  const { accessToken } = useToken()
  const User = useUserStore((state) => state.user);
  const clearUser = useUserStore((state) => state.clearUser);

  const [errorUser, setErrorUser] = useState(false)
  const [retry, setRetry] = useState(3)
  const router = useRouter()
  const [personalProjectLoading, setPersonalProjectLoading] = useState(false)
  const { error, updatePrjError, clearPrjError, addProjects, updateProjectLoading, addWorkspace } = useProjectStore(state => state);

  useEffect(() => {
    if (accessToken && !User) {
      fetchUser()
    }
  }, [accessToken, User])

  const fetchUser = async () => {
    try {
      const res = await getMyDetails(accessToken || '');
      if (res && res.statusCode !== 200) {
        throw new Error('Failed to fetch user')
      }
      useUserStore.getState().setUser(res.data)
      setRetry(() => 3)
      if (res.data && !res.data.primaryWorkspace) {
        router.replace('/dashboard/onboarding')
        return
      }
      if (res.data && !res.data.primaryProject) {
        setPersonalProjectLoading(true)
        await createNewProject()
        return;
      }
      await fetchWorkspaceAndProjects()
    } catch (err) {
      setRetry((prevRetry) => {
        const newRetry = prevRetry - 1
        if (newRetry <= 0) {
          setErrorUser(true)
          useUserStore.getState().clearUser()
        } else {
          setTimeout(() => fetchUser(), 5000)
        }
        return newRetry
      })
    }
  }

  const fetchWorkspaceAndProjects = async () => {
    try {
      const response = await getMyWorkspaceProjects(accessToken)
      if(response.statusCode===200){
       addProjects(response.data.projects) 
       addWorkspace(response.data.workspaces)
       updateProjectLoading(false)
       clearPrjError()
       router.replace('/dashboard/overview');
       return
      }
      throw ''
    } catch (error) {
      updatePrjError("Error Occured while Creating project")
      setPersonalProjectLoading(false)
    }
  }

  const createNewProject = async () => {
    try {
      const response = await createNewPersonalProject(accessToken, {
      })
      if (response.statusCode !== 200 || response.statusCode !== 201) {
        updatePrjError("Error Occured while Creating project")
        setPersonalProjectLoading(false)
        return
      }
      await fetchWorkspaceAndProjects()
    } catch (error) {
      updatePrjError("Error Occured while Creating project")
      setPersonalProjectLoading(false)
    }
  }


  if (personalProjectLoading) {
    return <NoProjectSelected />
  }

  if (error) {
    return <ErrorLoadingProject onRefresh={() => {
      clearUser()
      router.replace('/')
    }} />
  }



  // const fetchUserProjects = async () => {
  //   if (loading) {
  //     return
  //   }
  //   updateProjectLoading(true)
  //   setLoading(true)
  //   try {
  //     if (response && response.statusCode == 200) {
  //       if (response.data) {
  //         const sortedResponse = sortProjects(response.data);
  //         addProjects(sortedResponse)
  //         if (sortedResponse.length > 0) {
  //           selectProject(sortedResponse[0]);
  //         } else {
  //           const payLoad = {
  //             "projectName": createProjectTitle(user?.displayName),
  //             "projectType": 'personal',
  //             "description": "This is your personal project, you can add species to it. You can invite other users to this project.",
  //           };
  //           const resp = await createNewPersonalProject(token, payLoad)
  //           if (resp && resp.data) {
  //             const newProject = {
  //               ...resp.data,
  //               userRole: 'owner',
  //             } as ProjectWithUserRoleI;
  //             addProjects([newProject]);
  //             selectProject(newProject);
  //           } else {
  //             updatePrjError(resp?.message || 'Failed to create personal project');
  //           }
  //         }
  //       }
  //       return
  //     }
  //     updatePrjError(response?.message || 'Failed to fetch projects');
  //   } catch (error) {
  //     updatePrjError(String(error) || 'Failed to fetch projects');
  //   } finally {
  //     setLoading(false)
  //   }
  // }


  if (errorUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ zIndex: 1000 }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-green-100/30 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.3 }}
          className="relative mx-4 w-full max-w-xl overflow-hidden rounded-3xl bg-white p-8 shadow-2xl border border-green-200"
        >
          <motion.div
            key="failed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 text-center"
          >
            <div className="mb-5 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <XCircle size={24} />
              </div>
            </div>

            <h3 className="text-xl font-bold text-red-800">
              Error Occured
            </h3>

            <p className="text-gray-700">
            </p>
            <div className="space-y-4">
              <p className="text-red-600 font-medium">
                There was an error while fetching your details
              </p>
              <button
                onClick={() => { window.location.reload() }}
                className="cursor-pointer w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 transition hover:bg-gray-100"
              >
                Reload
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return <div className='h-full w-full flex items-center justify-center'>
    <Spinner />
  </div>
}