import MaintenanceScreen from '@/component/MaintenanceScreen';
import DashboardClientLayout from '@/app/dashboard/DashboardClientLayout';

export const dynamic = 'force-dynamic';

// User/global pages (profile, etc.): app bootstrap but no sidebar/topbar.
export default function StandaloneLayout({ children }: { children: React.ReactNode }) {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return <MaintenanceScreen restoreTime={process.env.MAINTENANCE_RESTORE_TIME} />;
  }

  return <DashboardClientLayout variant="standalone">{children}</DashboardClientLayout>;
}
