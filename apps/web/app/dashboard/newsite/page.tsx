"use client";
import CreateProject from "dashboard/pages/createSite/CreateSiteWeb";
import { useRouter } from "next/navigation";
import {useToken} from "dashboard/context/TokenContext"

export default function Dashboard() {
  const router = useRouter();
  const { accessToken } = useToken();
  return (
    <div className='w-full h-full'>
      <CreateProject token={accessToken} goBack={router.back}/>
    </div>
  );
}