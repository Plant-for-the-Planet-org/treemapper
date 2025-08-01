import { useState } from "react";
import { toast } from "react-toastify";
import { TestingModeRibbon, DisableTestingModeModal } from "./TestingModeRibbon";
import { exitImpersonationWork } from "@shared-core/fetchApi/api.fetch";
import { useToken } from "@/context/useTokenContext";

export const TestingModeManager = ({ mode }) => {
    const [showModal, setShowModal] = useState(false);
    const { accessToken } = useToken()
    // Placeholder API call
    const disableTestingMode = async () => {
        // TODO: Implement API call to disable testing mode
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate success/failure
                const success = Math.random() > 0.1; // 90% success rate for demo
                if (success) {
                    resolve({ statusCode: 200, message: 'Testing mode disabled successfully' });
                } else {
                    reject(new Error('Failed to disable testing mode'));
                }
            }, 2000);
        });
    };

    const handleDisableTestingMode = async () => {
        if (mode === 'impersonation') {
            const resp = await exitImpersonationWork(accessToken)
            if (resp.statusCode !== 200 || resp.statusCode !== 201) {
                throw ''
            }
            if (resp) {
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
            return
        }
        try {
            await disableTestingMode();
            toast.success('Preview mode disabled successfully!');
            setShowModal(false);
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            toast.error('Failed to disable preview mode. Please try again.');
        }
    };

    if (!mode || mode === '') return null;

    return (
        <>
            <TestingModeRibbon onDisableClick={() => setShowModal(true)} mode={mode} />
            <DisableTestingModeModal
                isOpen={showModal}
                mode={mode}
                onClose={() => setShowModal(false)}
                onConfirm={handleDisableTestingMode}
            />
        </>
    );
};