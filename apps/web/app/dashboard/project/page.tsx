"use client";
import CreateProject from "dashboard/pages/createProject/CreateProject";
import { useToken } from "../../contexts/TokenContext";


export default function Dashboard() {
  const { accessToken } = useToken()
  return (
    <div className='w-full h-full'>
      <CreateProject token={accessToken || ''} />
    </div>
  );
}