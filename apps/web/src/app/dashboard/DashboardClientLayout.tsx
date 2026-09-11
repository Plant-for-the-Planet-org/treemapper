"use client";

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAccessToken } from '@/hooks/useAccessToken';
import DashboardSidebar from '@/component/sidebar/DashboardSidebar';
import WorkspaceSidebar from '@/component/sidebar/WorkspaceSidebar';
import DashboardTopBar from '@/component/header/DashboardTopBar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { TopBarActionsProvider } from '@/component/header/TopBarActions';
import { TokenProvider } from '@/context/useTokenContext';
import useProjectStore from '@shared-core/store/useProjectStore';
import ImpersonationBanner from '@/component/header/ImpersonationBanner';
import useHomeStore from '@shared-core/store/useHomeStore';
import Spinner from '../../component/Spinner';
import { useEffect, useState, useCallback } from 'react';
import { useUserStore } from '@shared-core/store/useUserStore';
import { getMyWorkspaceProjects, createNewPersonalProject, getMyDetails, updateUserAvatar } from '@shared-core/fetchApi/api.fetch';
import { motion } from 'framer-motion';
import { MailWarning, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToastContainer } from 'react-toastify';
import ProjectInviteModal from '@/component/ProjectInviteModal';
// Migration off the old Planet platform is done, so this stays unmounted.
// import MigrationModal from '@/component/MigrationModal';
import { projectHref, subpageFromPath } from '@/lib/projectRoutes';
import { logout } from '@/lib/logout';
import { getAccessTokenSilently } from '@/lib/auth/auth0-config';
import { emailFromAccessToken } from '@/lib/auth/token-claims';
import { useAuthStore } from '@/stores/auth-store';

const STANDALONE_ROUTES = [
  'profile',
  'project',
  'newsite',
  'new-intervention',
  'onboarding',
  'workspace',
];

// Project subpages that render full-screen without the sidebar, even though
// they live under /project/:projectUid.
const STANDALONE_PROJECT_SUBPAGES = ['newsite', 'new-intervention'];

// Consolidated loading states
type LoadingState = 'loading' | 'success' | 'error' | 'idle';

export default function DashboardClientLayout({ children, variant = 'project' }: { children: React.ReactNode; variant?: 'project' | 'workspace' | 'standalone' }) {
  const { user, tokenError, tokenLoading, accessToken } = useAccessToken();
  const { addProjects, selectProject, setDefaultWorkspce, addWorkspace, workspace, projects, selectedWorkspce, selectedProject } = useProjectStore(state => state);
  const orgType = useHomeStore(state => state.orgType);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const User = useUserStore((state) => state.user);
  // Computed: true as soon as auth is confirmed and an invite param is in the URL.
  // Using state for this was the bug — when User was already in the store,
  // initializeApp was skipped and inviteFound was never set.
  const inviteFound = !!accessToken && !!(searchParams.get('project-invite') || searchParams.get('project-link'));
  // Simplified state management
  const [appState, setAppState] = useState<LoadingState>('idle');
  const [retryCount, setRetryCount] = useState(3);
  // Set when the API rejected the token itself. Retrying cannot change that
  // answer, so we stop straight away and say what the server said instead of
  // spinning for twenty seconds and then blaming the dashboard. `code` is the
  // server's stable reason and decides which screen to show; the message is the
  // fallback for reasons we do not have a screen for.
  const [authError, setAuthError] = useState<{ code?: string; message: string } | null>(null);
  const [recheckingEmail, setRecheckingEmail] = useState(false);

  const getCurrentSection = (path: string): string => {
    const section = STANDALONE_ROUTES.find(route => path.includes(`/dashboard/${route}`));
    if (section) return section;
    const sub = subpageFromPath(path);
    if (sub && STANDALONE_PROJECT_SUBPAGES.includes(sub)) return sub;
    return 'default';
  };

  const currentSection = getCurrentSection(pathname);
  const isStandaloneRoute = currentSection !== 'default';

  useEffect(() => {
    if (!tokenLoading && !accessToken) {
      // Preserve current URL with parameters when redirecting to login
      const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      const returnTo = encodeURIComponent(currentPath);
      router.push(`/login?returnTo=${returnTo}`);
      return;
    }
  }, [accessToken, tokenLoading, router, searchParams, pathname]);

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
    } else if (User && appState === 'idle') {
      // Layout remounted (e.g. crossing route-group subtrees) with data
      // already loaded; mark success so the sidebar renders immediately.
      setAppState('success');
    }
  }, [accessToken, User, appState]);


  const updateAvater = async () => {
    if (User && !User.impersonated && !User.image && user.picture) {
      await updateUserAvatar(accessToken, { avatarUrl: user.picture, firstName: user.name || '' })
    }
  }

  const setDefaultProjectAndWorkspace = useCallback(() => {
    if (!User?.primaryProjectUid) return;

    const defaultProject = projects.find(p => p.uid === User.primaryProjectUid);

    const workspaceUid = defaultProject?.workspace?.uid ?? User.primaryWorkspaceUid;
    const defaultWorkspace = workspace.find(w => w.uid === workspaceUid);

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
      const failure = new Error(
        res?.message || 'Failed to fetch user details'
      ) as Error & { statusCode?: number; code?: string };
      failure.statusCode = res?.statusCode;
      failure.code = res?.code;
      throw failure;
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
        setAppState('success');
        return;
      }
      // Step 2: Check if user needs onboarding
      if (!userData.primaryWorkspaceUid) {
        router.push('/onboard');
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

      setAppState('success');
      setRetryCount(3); // Reset retry count on success

    } catch (error) {
      console.error('App initialization failed:', error);
      const failure = error as Error & { statusCode?: number; code?: string };
      if (failure?.statusCode === 401 || failure?.statusCode === 403) {
        setAuthError({
          code: failure.code,
          message: failure.message || 'Your session is no longer valid.',
        });
        setAppState('error');
        return;
      }
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
    setAuthError(null);
    setRetryCount(3);
    setAppState('idle');
  };

  const handleLogout = () => {
    logout({ accessToken, impersonating: !!(User as { impersonated?: boolean } | null)?.impersonated });
  };

  // The token carries `email_verified` from the moment Auth0 minted it, so
  // refetching with the same token returns the same refusal however many times
  // the user clicks. Get a fresh one first: silent auth re-runs Auth0 against the
  // now-verified profile. Browsers that block the hidden iframe (third-party
  // cookie rules increasingly do) return null, so fall through to a full sign-in,
  // which always mints a new token. Either way the user moves forward.
  const handleEmailVerifiedRecheck = async () => {
    setRecheckingEmail(true);
    try {
      const freshToken = await getAccessTokenSilently();
      if (!freshToken) {
        handleLogout();
        return;
      }
      useAuthStore.getState().setAccessToken(freshToken);
      setAuthError(null);
      setRetryCount(3);
      setAppState('idle');
    } catch {
      handleLogout();
    } finally {
      setRecheckingEmail(false);
    }
  };

  const navigationHandlers = {
    createNewProject: () => router.push('/create-project'),
    openProfileSetting: () => router.push('/profile'),
    updateRoute: (newRoute: string) => {
      if (newRoute === 'workspace') {
        router.push('/workspace');
        return;
      }
      const subpage = newRoute === '' ? 'overview' : newRoute;
      const projectUid = selectedProject?.uid;
      if (projectUid) {
        router.push(projectHref(projectUid, subpage));
        return;
      }
      router.push('/');
    }
  };

  // Handle token errors
  if (tokenError) {
    handleLogout();
    return <div className="p-8 text-center text-red-500">Error: {String(tokenError)}</div>;
  }

  // Show loading for initial authentication
  if (tokenLoading || !accessToken) {
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
      // The email is not verified yet. This is a pending step, not a failure, so
      // it gets its own screen: what to do, which address to do it at, and a way
      // out if that address is the wrong one.
      const unverified = authError?.code === 'email_not_verified';
      const signedInAs = unverified ? emailFromAccessToken(accessToken) : undefined;

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
            className="relative mx-4 w-full max-w-md overflow-hidden rounded-3xl bg-white p-8 shadow-2xl border border-green-200"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 text-center"
            >
              <div className="flex items-center justify-center">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${unverified ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                    }`}
                >
                  {unverified ? <MailWarning size={24} /> : <XCircle size={24} />}
                </div>
              </div>

              <h3 className={`text-xl font-bold ${unverified ? 'text-gray-900' : 'text-red-800'}`}>
                {unverified ? 'Verify your email' : 'Error Occurred'}
              </h3>

              {unverified ? (
                <>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      Open the link we sent to{' '}
                      <span className="font-medium break-all text-gray-900">
                        {signedInAs || 'your email address'}
                      </span>
                      , then come back here.
                    </p>
                    <p className="text-gray-500">Not there? Check your spam folder.</p>
                  </div>
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={handleEmailVerifiedRecheck}
                      disabled={recheckingEmail}
                    >
                      {recheckingEmail ? 'Checking...' : 'I have verified, check again'}
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleLogout}>
                      Sign in with a different account
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium text-red-600">
                    {/* `email_missing` means the token reached us with no address on
                        it, which is a tenant misconfiguration. "Email not found in
                        token" is the right thing to log and the wrong thing to show
                        a person, so it gets plain copy. */}
                    {authError?.code === 'email_missing'
                      ? 'We could not read your email address from your sign in. Please sign in again.'
                      : authError?.message || 'There was an error while loading your dashboard'}
                  </p>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={authError ? handleLogout : handleRetry}
                    >
                      {authError ? 'Sign in again' : 'Try Again'}
                    </Button>
                    {!authError && (
                      <Button variant="ghost" className="w-full" onClick={handleLogout}>
                        Sign out
                      </Button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </div>
      );
    }

    // Standalone variant (user/global pages like profile): no project context.
    if (variant === 'standalone') {
      return children;
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

  const showSidebar = appState === 'success' && variant !== 'standalone' && (variant === 'workspace' || !isStandaloneRoute);

  return (
    <TokenProvider accessToken={accessToken}>
      <div className='parent'>
        <div className="app-container">
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
            {inviteFound && <ProjectInviteModal />}
            {/* Mounting this fired GET /migration/check against the old Planet
                backend on every dashboard load, for every user whose
                `migratedAt` was still null. The migration is finished, so it is
                off. The component and the /migration/* endpoints are kept for a
                manual re-run. */}
            {/* <MigrationModal/> */}
            <SidebarProvider
              defaultOpen={typeof window !== 'undefined' ? window.innerWidth >= 1280 : true}
              className="!min-h-0 h-full overflow-hidden"
            >
              {showSidebar && (variant === 'workspace' ? <WorkspaceSidebar /> : <DashboardSidebar {...navigationHandlers} />)}
              <SidebarInset className="flex flex-col overflow-hidden min-h-0">
                <ImpersonationBanner />
                <TopBarActionsProvider>
                  {showSidebar && variant !== 'workspace' && <DashboardTopBar />}
                  {renderMainContent()}
                </TopBarActionsProvider>
              </SidebarInset>
            </SidebarProvider>
        </div>
      </div>
    </TokenProvider>
  );
}
