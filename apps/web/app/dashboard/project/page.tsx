"use client";
import CreateProject from "dashboard/pages/createProject/CreateProject";
import { useRouter } from "next/navigation";
import { useToken } from 'dashboard/context/TokenContext'

export default function Dashboard() {
  const router = useRouter();
  const { accessToken } = useToken()
  const back = () => {
    router.back();
  };
  return (
    <div className='w-full h-full'>
      <CreateProject goBack={back} token={accessToken}/>
    </div>
  );
}