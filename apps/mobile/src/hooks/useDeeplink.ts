import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';

interface DeepLinkParams {
    projectLink?: string;
    poseId?: string;
    // Add other parameters as needed
}

export const useDeepLinking = () => {
    const navigation = useNavigation();
    const parseDeepLink = (url: string): DeepLinkParams | null => {
        try {
            const parsed = Linking.parse(url);
            const { queryParams } = parsed;
            console.log("DKSc", parsed)
            return {
                projectLink: queryParams?.['project-link'] as string,
            };
        } catch (error) {
            console.error('Error parsing deep link:', error);
            return null;
        }
    };

    const handleDeepLink = (params: DeepLinkParams) => {
        if (params.projectLink) {
            // Navigate to project screen with project ID
            navigation.navigate('ProjectScreen', {
                projectId: params.projectLink
            });
        } else if (params.poseId) {
            // Navigate to pose screen with pose ID
            navigation.navigate('PoseScreen', {
                poseId: params.poseId
            });
        }
        // Add more navigation logic as needed
    };

    const processInitialURL = async () => {
        try {
            const initialUrl = "https://dev.treemapper.app/dashboard?project-link=bb708e3c-20c4-4069-a902-67fd9902a676"
            console.log("initialUrl",initialUrl)
            if (initialUrl) {
                console.log('Initial URL:', initialUrl);
                const params = parseDeepLink(initialUrl);
                if (params) {
                    // Add a small delay to ensure navigation is ready
                    setTimeout(() => handleDeepLink(params), 1000);
                }
            }
        } catch (error) {
            console.error('Error getting initial URL:', error);
        }
    };

    const handleUrlChange = ({ url }: { url: string }) => {
        console.log('URL changed:', url);
        const params = parseDeepLink(url);
        if (params) {
            handleDeepLink(params);
        }
    };

    useEffect(() => {
        // Handle initial URL when app is opened from a deep link
        processInitialURL();

        // Handle URL changes when app is already running
        const subscription = Linking.addEventListener('url', handleUrlChange);

        return () => {
            subscription?.remove();
        };
    }, []);

    return {
        parseDeepLink,
        handleDeepLink,
    };
};