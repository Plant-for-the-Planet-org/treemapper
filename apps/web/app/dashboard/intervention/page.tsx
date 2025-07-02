"use client";
import InterventionHome from 'dashboard/pages/interventions/InterventionHome'
import { useRouter } from 'next/navigation';
export default function Dashboard() {
  const router = useRouter();
    const newIntervention = () => {
    router.push(`/dashboard/new-intervention`)
  }
  const bulkUpload = () => {
    router.push(`/dashboard/bulkupload`)
  }
  return (
    <div className="w-full h-full flex items-center justify-center">
      <InterventionHome newIntervention={newIntervention} bulkUpload={bulkUpload}/>
    </div>
  );
}