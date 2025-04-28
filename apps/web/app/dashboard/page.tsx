"use client";
import Home from 'dashboard/pages/home/Home'
import { useAccessToken } from '../../hooks/useAccessToken';

export default function Dashboard() {
    const { accessToken, isLoading, error } = useAccessToken();
    console.log('Access Token:', accessToken, isLoading, error);
    return (
        <div className='w-full h-full'>
            <Home />
        </div>
    );
}