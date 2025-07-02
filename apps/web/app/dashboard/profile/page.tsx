"use client";
import ProfileSetting from 'dashboard/pages/profile/ProfileHomeWeb'
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  
  return (
    <div className='w-full h-full'>
       <ProfileSetting goBack={router.back}/>
    </div>
);
}