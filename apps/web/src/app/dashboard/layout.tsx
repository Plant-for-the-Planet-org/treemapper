"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useAccessToken } from '@/hooks/useAccessToken';
import DashboardHeaderWeb from '@/component/header/MainHeader';
import { TokenProvider, useToken } from '@/context/useTokenContext';
import useProjectStore from '@shared-core/store/useProjectStore';
import { TestingModeManager } from '@/component/TestingModeManager';
import useHomeStore from '@shared-core/store/useHomeStore';
import Spinner from '../../component/Spinner';
import { useEffect, useState } from 'react';
import { useUserStore } from '@shared-core/store/useUserStore';
import { getMyWorkspaceProjects, createNewPersonalProject, getMyDetails } from '@shared-core/fetchApi/api.fetch';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';
import NoProjectSelected from '@/component/NoProjectPlaceHolder';
import ErrorLoadingProject from '@/component/ProjectErrorPlaceholder';

const STANDALONE_ROUTES = [
  'profile',
  'project',
  'newsite',
  'bulkupload',
  'new-intervention',
  'onboarding'
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, tokenError, tokenLoading, accessToken } = useAccessToken();
  const { addProjects, selectProject, setDefaultWorkspce, addWorkspace, workspace, projects, selectedWorkspce, selectedProject } = useProjectStore(state => state);
  const orgType = useHomeStore(state => state.orgType);
  const router = useRouter();
  const pathname = usePathname();
  const User = useUserStore((state) => state.user);
  const [retry, setRetry] = useState(3)
  const [userLoading, setUserLoading] = useState(true)
  const [userLoadingFailed, setUserLoadingFailed] = useState(false)
  const [personalProjectLoading, setPersonalProjectLoading] = useState(false)
  const [personalProjectFailed, setPersonalProjectFailed] = useState(false)
  const [workspaceDetailsLoading, setWorkspaceDetailsLoading] = useState(false)
  const [workspaceDetailsLoadingFailed, setWorkspaceDetailsLoadingFailed] = useState(false)



  const getCurrentSection = (path: string): string => {
    const section = STANDALONE_ROUTES.find(route => path.includes(`/dashboard/${route}`));
    return section || 'default';
  };

  const currentSection = getCurrentSection(pathname);
  const isStandaloneRoute = currentSection !== 'default';
  useEffect(() => {
    if (!tokenLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, tokenLoading, router, currentSection]);


  useEffect(() => {
    if (User) {
      setDefaultProjectandWorkspace(projects, workspace)
    }
  }, [User, projects, workspace])



  useEffect(() => {
    if (accessToken && !User) {
      fetchUser()
    }
  }, [accessToken, User])

  const fetchUser = async () => {
    try {
      setUserLoadingFailed(false)
      const res = await getMyDetails(accessToken);
      if (res && res.statusCode !== 200) {
        throw new Error('Failed to fetch user')
      }
      useUserStore.getState().setUser(res.data)
      setRetry(() => 3)
      if (res.data && !res.data.primaryWorkspace) {
        router.push('/dashboard/onboarding')
        setUserLoading(false)
        return
      }
      if (res.data && !res.data.primaryProject) {
        setPersonalProjectLoading(true)
        setUserLoading(false)
        await createNewProject()
        return;
      }
      setUserLoading(false)
      await fetchWorkspaceAndProjects()
    } catch (err) {
      setRetry((prevRetry) => {
        const newRetry = prevRetry - 1
        if (newRetry <= 0) {
          setUserLoadingFailed(true)
          setUserLoading(false)
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
      setWorkspaceDetailsLoading(true)
      const response = await getMyWorkspaceProjects(accessToken)
      if (response.statusCode === 200) {
        addProjects(response.data.projects)
        addWorkspace(response.data.workspaces)
        if (currentSection === 'default') {
          router.replace('/dashboard/overview');
        }
        setWorkspaceDetailsLoading(false)
        return
      }
      throw ''
    } catch (error) {
      setWorkspaceDetailsLoading(false)
      setWorkspaceDetailsLoadingFailed(true)
    }
  }



  const setDefaultProjectandWorkspace = (projects, workspace) => {
    const projectFilter = projects.filter(el => el.id === User.primaryProject)
    const workspaceFilter = workspace.filter(el => el.id === User.primaryWorkspace)
    if (projectFilter.length > 0 && !selectedProject) {
      selectProject(projectFilter[0])
    }
    if (workspaceFilter.length > 0 && !selectedWorkspce) {
      setDefaultWorkspce(workspaceFilter[0])
    }
  }



  const createNewProject = async () => {
    setPersonalProjectFailed(false)
    try {
      const response = await createNewPersonalProject(accessToken, {
      })
      if (response.statusCode !== 200 && response.statusCode !== 201) {
        throw ''
      }
      await fetchWorkspaceAndProjects()
    } catch (error) {
      setPersonalProjectLoading(false)
      setPersonalProjectFailed(true)
    }
  }





  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };


  const navigationHandlers = {
    createNewProject: () => router.push('/dashboard/project'),
    openProfileSetting: () => router.push('/dashboard/profile'),
    updateRoute: (newRoute: string) => router.push(`/dashboard/${newRoute}`)
  };

  // Loading and error states
  if (tokenError) {
    handleLogout();
    return <div className="p-8 text-center text-red-500">Error: {String(tokenError)}</div>;
  }

  if (tokenLoading || !user) {
    return (
      <div className="flex justify-center items-center h-full w-full" style={{ width: '100vw', height: '100vh' }}>
        <Spinner />
      </div>
    );
  }

  const renderMainContent = () => {

    if (userLoading || workspaceDetailsLoading) {
      return <div className='h-full w-full flex items-center justify-center'>
        <Spinner />
      </div>
    }

    if (userLoadingFailed) {
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

    if (personalProjectLoading) {
      return <NoProjectSelected />
    }

    if (personalProjectFailed || workspaceDetailsLoadingFailed) {
      return <ErrorLoadingProject onRefresh={() => {
        window.location.reload()
      }} />
    }


    if (isStandaloneRoute) {
      if (!selectedProject && currentSection!== 'onboarding') {
        return <div className='h-full w-full flex items-center justify-center'>
          <Spinner />
        </div>
      }
      return children;
    }

    return children;
  };

  return (
    <TokenProvider accessToken={accessToken}>
      <div className='parent'>
        <div className="app-container">
          <div className="app-content">
            <TestingModeManager devMode={orgType === 'dev'} />
            {userLoading || workspaceDetailsLoading || userLoadingFailed || personalProjectFailed || personalProjectLoading || workspaceDetailsLoadingFailed ? null : isStandaloneRoute ? null : (
              <DashboardHeaderWeb
                token={accessToken}
                {...navigationHandlers}
              />
            )}
            {renderMainContent()}
          </div>
        </div>
      </div>
    </TokenProvider>
  );
}