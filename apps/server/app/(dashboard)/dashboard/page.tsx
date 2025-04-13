'use client';


import { useEffect } from "react";
import Home from 'dashboard/pages/home/screen'

export default function Dashboard() {
  return (
    <div className="page-container" style={{ width: '100%', height: '100%' }}>
      <Home/>
    </div>
  );
}