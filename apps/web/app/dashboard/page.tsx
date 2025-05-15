// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProjectInviteModal from '../../components/ProjectInviteModal';
import OverViewUI from 'dashboard/pages/overview/OverView';

export default function Dashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [projectData, setProjectData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check if project-invite parameter exists
        const projectInviteId = searchParams.get('project-invite');
        const projectID = searchParams.get('projectId');

        console.log("SDc", projectInviteId)
        if (projectInviteId) {
            setLoading(true);
            // Fetch project details
            fetch(`http://192.168.0.103:3001/projects/${projectID}`)
                .then(res => res.json())
                .then(resp => {
                    setProjectData(resp.data);
                    setShowInviteModal(true);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching project details:', err);
                    setLoading(false);
                });
        }
    }, [searchParams]);

    const handleAccept = async () => {
        try {
            const projectInviteId = searchParams.get('project-invite');
            const res = await fetch(`/api/projects/invite/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inviteId: projectInviteId
                }),
            });

            if (res.ok) {
                setShowInviteModal(false);
                // Refresh dashboard or redirect to the project
                router.push(`/project/${projectData.id}`);
            }
        } catch (error) {
            console.error('Error accepting invitation:', error);
        }
    };

    const handleDecline = async () => {
        try {
            const projectInviteId = searchParams.get('project-invite');
            await fetch(`/api/projects/invite/decline`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inviteId: projectInviteId
                }),
            });

            setShowInviteModal(false);
            // Stay on dashboard
        } catch (error) {
            console.error('Error declining invitation:', error);
        }
    };

    return (
        <div className='w-full h-full'>
            <OverViewUI />
            {/* Project Invite Modal */}
            {showInviteModal && projectData && (
                <ProjectInviteModal
                    project={projectData}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    onClose={() => setShowInviteModal(false)}
                />
            )}
        </div>
    );
}