"use client";
import SitesHome from 'dashboard/pages/sites/SitesHomeWeb';
import { useRouter } from 'next/navigation';
export default function Dashboard() {
    const router = useRouter();
    const handleCreateNewSite = () => {
        router.push('/dashboard/newsite');
    };
    return (
        <div className='w-full h-full'>
            <SitesHome handleCreateNewSite={handleCreateNewSite}/>
        </div>
    );
}