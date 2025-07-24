import { useState } from "react";
import { toast } from "react-toastify";
import { TestingModeRibbon, DisableTestingModeModal } from "./TestingModeRibbon";

export const TestingModeManager = ({ devMode }: { devMode: boolean }) => {
    const [showModal, setShowModal] = useState(false);
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
        try {
            await disableTestingMode();
            toast.success('Preview mode disabled successfully!');
            setShowModal(false);

            // Reload the page after successful disable
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            toast.error('Failed to disable preview mode. Please try again.');
        }
    };

    if (!devMode) return null;

    return (
        <>
            <TestingModeRibbon onDisableClick={() => setShowModal(true)} />
            <DisableTestingModeModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleDisableTestingMode}
            />
        </>
    );
};