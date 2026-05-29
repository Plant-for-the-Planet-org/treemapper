import MaintenanceScreen from '@/component/MaintenanceScreen';
import DashboardClientLayout from '@/app/dashboard/DashboardClientLayout';

export const dynamic = 'force-dynamic';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return <MaintenanceScreen restoreTime={process.env.MAINTENANCE_RESTORE_TIME} />;
  }

  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
