export { apiClient } from './client';
export { API_ENDPOINTS } from './endpoints';
export { queryKeys } from './query-keys';
export {  organizationQueries,notificationQueries,projectQueries} from './queries';
export {  organizationMutations,notificationMutations,projectMutations} from './mutations';

// Provider exports
export { SharedQueryProvider } from '../providers/query-provider';


export { useAuth } from '../hooks/use-auth';

export {
  useOrganizations,
  useCreateOrganization,
  useUpdateOrganization
} from '../hooks/useOrganization';


export {
  useMyNotifications,
  useMarkAllNotificationsRead,
  useUnreadNotificationCount,
} from '../hooks/useNotifications';

export {
  useMyProjects,
  useProject,
  useCreatePersonalProject,
  useCreateProject,
  useCreateProjectTitle,
} from '../hooks/useProjects';


export {useUserMe
} from '../hooks/useUser';

export {
  useMigrationCheck,
  useStartMigration,
  useMigrationStatus,
} from '../hooks/useMigration';




// Utils exports
export { queryUtils } from '../utils/query-utils';
export { handleApiError, ApiError } from '../utils/error-handler';

// Types exports
export type {
  ApiResponse,
} from '../types/api-responses';
export type { QueryConfig as QueryConfigType } from '../types/query-types';

export type {
  Notification,
} from '../types/api-responses';

export type {
  Project,
  CreateProjectRequest,
} from '../types/api-responses';