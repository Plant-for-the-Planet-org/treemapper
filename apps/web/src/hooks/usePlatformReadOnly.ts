import useProjectStore from '@shared-core/store/useProjectStore';
import { useUserStore } from '@shared-core/store/useUserStore';

export function usePlatformReadOnly(): boolean {
  const workspace = useProjectStore((state) => state.selectedWorkspce);
  const user = useUserStore((state) => state.user);

  if (workspace?.type !== 'platform') return false;
  return user?.type !== 'superadmin';
}
