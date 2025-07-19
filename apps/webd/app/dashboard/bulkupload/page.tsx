"use client";
import BulkUploadHome from 'dashboard/pages/bulkupload/BulkUploadHomeWeb';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  return (
    <div className="w-full h-full bg-gray-50 ">
      <BulkUploadHome goback={router.back} />
    </div>
  );
}