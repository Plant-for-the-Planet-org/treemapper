// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProjectInviteModal from '../../components/ProjectInviteModal';
import OverViewUI from 'dashboard/pages/overview/OverView';
import { acceptProjectInvite, declineProjectInvite, getInviteStatus } from 'dashboard/api/api.fetch';
import { useToken } from 'dashboard/context/TokenContext';
import { toast } from 'react-toastify';

export default function Dashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [inviteData, setInviteData] = useState(null);
    const [loading, setLoading] = useState(false);
    const { accessToken } = useToken()

    useEffect(() => {
        checkInviteStatus()
    }, [searchParams]);

    const checkInviteStatus = async () => {
        try {
            const projectInviteId = searchParams.get('project-invite');
            if (!projectInviteId || !accessToken) {
                setLoading(false);
                return
            }
            setLoading(true);
            const response = await getInviteStatus(accessToken || '', projectInviteId || '')
            if (response.statusCode === 200) {
                setInviteData(response.data);
                setLoading(false);
                return
            }
            toast.error('Failed to fetch invite status. Please try again later.');
            setLoading(false);
        } catch (error) {
            setLoading(false);

        }
    }

    const handleAccept = async () => {
        try {
            setLoading(true);
            const projectInviteId = searchParams.get('project-invite');
            const response = await acceptProjectInvite(accessToken || '', {
                token: projectInviteId
            });
            setLoading(false);
            if (response && response.statusCode === 200) {
                const url = new URL(window.location.href);
                url.searchParams.delete('project-invite');
                toast.success('Project invite accepted successfully. Redirecting to project dashboard...');
                window.location.href = url.toString();
                setInviteData(null);
                return
            }
            if (response && response.message) {
                toast.error(String(response.message));
                return
            }

        } catch (error) {
            setLoading(false);
            console.error('Error accepting invitation:', error);
            toast.error('Error accepting invitation:');
        }
    };


    const handleDecline = async () => {
        try {
            setLoading(true);
            const projectInviteId = searchParams.get('project-invite');
            const response = await declineProjectInvite(accessToken || '', {
                token: projectInviteId
            });
            setLoading(false);
            if (response && response.statusCode === 200) {
                const url = new URL(window.location.href);
                url.searchParams.delete('project-invite');
                toast.warning('Project invite declined successfully');
                window.location.href = url.toString();
                setInviteData(null);
                return
            }
            if (response && response.message) {
                toast.error(String(response.message));
                return
            }

        } catch (error) {
            setLoading(false);
            console.error('Error declining invitation:', error);
            toast.error('Error declining invitation:');
        }
    };

    const handleClose = async () => {
        const url = new URL(window.location.href);
        url.searchParams.delete('project-invite');
        toast.warning('Project invite declined successfully');
        window.location.href = url.toString();
        setInviteData(null)
    };

    return (
        <div className='w-full h-full'>
            <OverViewUI />
            {/* Project Invite Modal */}
            {inviteData && (
                <ProjectInviteModal
                    loading={loading}
                    invitation={inviteData}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    onClose={handleClose}
                />
            )}
        </div>
    );
}