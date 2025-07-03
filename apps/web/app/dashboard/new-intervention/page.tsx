"use client";
import BulkUploadHome from 'dashboard/pages/newIntervention/InterventionHome'
import { useRouter } from 'next/navigation';
export default function Dashboard() {
  const router = useRouter();
  const goBacktoDashboard = () => {
    router.push('/dashboard/intervention')
  }
  return (
    <div className="w-full h-full">
      <BulkUploadHome goBack={goBacktoDashboard} />
    </div>
  );
}