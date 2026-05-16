"use client";

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAccessToken } from '@/hooks/useAccessToken';
import DashboardHeaderWeb from '@/component/header/MainHeader';
import { TokenProvider } from '@/context/useTokenContext';
import useProjectStore from '@shared-core/store/useProjectStore';
import { TestingModeManager } from '@/component/TestingModeManager';
import useHomeStore from '@shared-core/store/useHomeStore';
import Spinner from '../../component/Spinner';
import { useEffect, useState, useCallback } from 'react';
import { useUserStore } from '@shared-core/store/useUserStore';
import { getMyWorkspaceProjects, createNewPersonalProject, getMyDetails, updateUserAvatar } from '@shared-core/fetchApi/api.fetch';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import ProjectInviteModal from '@/component/ProjectInviteModal';
import MigrationModal from '@/component/MigrationModal';

const STANDALONE_ROUTES = [
  'profile',
  'project',
  'newsite',
  'bulkupload',
  'new-intervention',
  'onboarding',
  'workspace',
  'select-workspace'
];

// Consolidated loading states
type LoadingState = 'loading' | 'success' | 'error' | 'idle';

export default function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  const { user, tokenError, tokenLoading, accessToken } = useAccessToken();
  const { addProjects, selectProject, setDefaultWorkspce, addWorkspace, workspace, projects, selectedWorkspce, selectedProject } = useProjectStore(state => state);
  const orgType = useHomeStore(state => state.orgType);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const User = useUserStore((state) => state.user);
  const [inviteFound, setInviteFound] = useState(false)
  // Simplified state management
  const [appState, setAppState] = useState<LoadingState>('idle');
  const [retryCount, setRetryCount] = useState(3);

  const getCurrentSection = (path: string): string => {
    const section = STANDALONE_ROUTES.find(route => path.includes(`/dashboard/${route}`));
    return section || 'default';
  };

  const currentSection = getCurrentSection(pathname);
  const isStandaloneRoute = currentSection !== 'default';

  // Check if user is on the root dashboard path WITHOUT any query parameters
  // If there are query params (like project-invite), don't redirect
  const isRootDashboardPath = (pathname === '/dashboard' || pathname === '/dashboard/') && !searchParams.toString();

  useEffect(() => {
    if (!tokenLoading && !user) {
      // Preserve current URL with parameters when redirecting to login
      const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      const returnTo = encodeURIComponent(currentPath);
      router.push(`/login?returnTo=${returnTo}`);
      return;
    }
    handleNav();
  }, [user, tokenLoading, router, searchParams, pathname]);

  const handleNav = () => {
    const name = searchParams.get('name');
    const type = searchParams.get('type');
    if (name) {
      router.replace(`/dashboard/project?name=${name}&type=${type}`)
      return
    }
  }

  // Set default project and workspace when data is available
  useEffect(() => {
    if (User && projects.length > 0 && workspace.length > 0) {
      setDefaultProjectAndWorkspace();
      updateAvater()
      return
    }
  }, [User, projects, workspace]);

  // Initialize app data when token is available
  useEffect(() => {
    if (accessToken && !User && appState === 'idle') {
      initializeApp();
    }
  }, [accessToken, User, appState]);


  const updateAvater = async () => {
    if (User && !User.impersonated && !User.image && user.picture) {
      await updateUserAvatar(accessToken, { avatarUrl: user.picture, firstName: user.name || '' })
    }
  }

  const setDefaultProjectAndWorkspace = useCallback(() => {
    if (!User?.primaryProjectUid || !User?.primaryWorkspaceUid) return;

    const defaultProject = projects.find(p => p.uid === User.primaryProjectUid);
    const defaultWorkspace = workspace.find(w => w.uid === User.primaryWorkspaceUid);

    if (defaultProject && !selectedProject) {
      selectProject(defaultProject);
    }
    if (defaultWorkspace && !selectedWorkspce) {
      setDefaultWorkspce(defaultWorkspace);
    }
  }, [User, projects, workspace, selectedProject, selectedWorkspce, selectProject, setDefaultWorkspce]);

  const fetchUserDetails = async (): Promise<any> => {
    const res = await getMyDetails(accessToken);
    if (res?.statusCode !== 200) {
      throw new Error('Failed to fetch user details');
    }
    return res.data;
  };

  const fetchWorkspaceAndProjects = async () => {
    const response = await getMyWorkspaceProjects(accessToken);
    if (response?.statusCode !== 200) {
      throw new Error('Failed to fetch workspace and projects');
    }

    addProjects(response.data.projects);
    addWorkspace(response.data.workspaces);
    return response.data;
  };

  const createPersonalProject = async () => {
    const response = await createNewPersonalProject(accessToken, {});
    if (response?.statusCode !== 200 && response?.statusCode !== 201) {
      throw new Error('Failed to create personal project');
    }
    return response;
  };

  const initializeApp = async () => {
    setAppState('loading');

    try {
      // Step 1: Fetch user details
      const userData = await fetchUserDetails();
      useUserStore.getState().setUser(userData);
      const projectInviteId = searchParams.get('project-invite');
      const projectLinkInviteId = searchParams.get('project-link');
      if (projectInviteId || projectLinkInviteId) {
        setInviteFound(true)
        return
      }
      // Step 2: Check if user needs onboarding
      if (!userData.primaryWorkspaceUid) {
        router.push('/dashboard/onboarding');
        setAppState('success');
        return;
      }

      // Step 3: Create personal project if needed
      if (!userData.primaryProjectUid) {
        await createPersonalProject();
        // Refresh user data after creating project
        const updatedUserData = await fetchUserDetails();
        useUserStore.getState().setUser(updatedUserData);
      }

      // Step 4: Fetch workspace and projects
      await fetchWorkspaceAndProjects();

      // Step 5: Only redirect to overview if user is on the exact root dashboard path
      // This preserves other routes like /dashboard/species, /dashboard/species?a=1&b=2, etc.
      if (isRootDashboardPath) {
        router.replace('/dashboard/overview');
      }

      setAppState('success');
      setRetryCount(3); // Reset retry count on success

    } catch (error) {
      console.error('App initialization failed:', error);
      handleError();
    }
  };

  const refreshAppData = async () => {
    try {
      setAppState('loading');

      // Fetch fresh user data
      const userData = await fetchUserDetails();
      useUserStore.getState().setUser(userData);

      // Fetch fresh workspace and projects
      await fetchWorkspaceAndProjects();

      setAppState('success');
    } catch (error) {
      console.error('Data refresh failed:', error);
      // Don't show error UI for refresh failures, just log them
      setAppState('success'); // Keep the current state
    }
  };

  const handleError = () => {
    if (retryCount > 0) {
      setRetryCount(prev => prev - 1);
      setTimeout(() => {
        setAppState('idle'); // This will trigger initializeApp again
      }, 5000);
    } else {
      setAppState('error');
      useUserStore.getState().clearUser();
    }
  };

  const handleRetry = () => {
    setRetryCount(3);
    setAppState('idle');
  };

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  const navigationHandlers = {
    createNewProject: () => router.push('/dashboard/project'),
    openProfileSetting: () => router.push('/dashboard/profile'),
    updateRoute: (newRoute: string) => {
      const route = newRoute === '' ? '/dashboard' : `/dashboard/${newRoute}`;
      router.push(route);
    }
  };

  // Handle token errors
  if (tokenError) {
    handleLogout();
    return <div className="p-8 text-center text-red-500">Error: {String(tokenError)}</div>;
  }

  // Show loading for initial authentication
  if (tokenLoading || !user) {
    return (
      <div className="flex justify-center items-center h-full w-full" style={{ width: '100vw', height: '100vh' }}>
        <Spinner />
      </div>
    );
  }

  // Render main content based on app state
  const renderMainContent = () => {
    if (appState === 'loading') {
      return (
        <div className='h-full w-full flex items-center justify-center'>
          <Spinner />
        </div>
      );
    }

    if (appState === 'error') {
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
                Error Occurred
              </h3>

              <div className="space-y-4">
                <p className="text-red-600 font-medium">
                  There was an error while loading your dashboard
                </p>
                <button
                  onClick={handleRetry}
                  className="cursor-pointer w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 transition hover:bg-gray-100"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      );
    }

    // For standalone routes, ensure project is selected (except onboarding)
    if (isStandaloneRoute) {
      if (!selectedProject && currentSection !== 'onboarding') {
        return (
          <div className='h-full w-full flex items-center justify-center'>
            <Spinner />
          </div>
        );
      }
      return children;
    }

    return children;
  };

  // Show header only when app is ready and not on standalone routes
  const showHeader = appState === 'success' && !isStandaloneRoute;

  return (
    <TokenProvider accessToken={accessToken}>
      <div className='parent'>
        <div className="app-container">
          <div className="app-content">
            <ToastContainer
              position="top-right"
              autoClose={4000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
              limit={3}
              closeButton={true}
            />
            <TestingModeManager mode={User && User.impersonated ? 'impersonation' : ''} />
            {inviteFound && <ProjectInviteModal />}
            {showHeader && (
              <DashboardHeaderWeb
                token={accessToken}
                {...navigationHandlers}
                isLoading={appState === 'idle' || appState === 'loading'}
              />
            )}
            {renderMainContent()}
            <MigrationModal/>
          </div>
        </div>
      </div>
    </TokenProvider>
  );
}
