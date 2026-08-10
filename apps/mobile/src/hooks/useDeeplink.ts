import { useEffect, useCallback, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { AppState, AppStateStatus } from 'react-native';
import { useDispatch } from 'react-redux';
import { updateInviteId } from 'src/store/slice/tempStateSlice';

// Define your navigation stack types
type RootStackParamList = {
    // Add your actual screen names here
    ProjectScreen: { projectId: string };
    PoseScreen: { poseId: string };
    // ... other screens
};

interface DeepLinkParams {
    projectLink?: string;
    projectInvite?: string;
    poseId?: string;
}

export const useDeepLinking = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const appState = useRef(AppState.currentState);
    const hasHandledInitialUrl = useRef(false);
    const dispatch = useDispatch();
    const parseDeepLink = useCallback((url: string): DeepLinkParams | null => {
        try {
            const parsed = Linking.parse(url);
            const { queryParams } = parsed;
            

            return {
                projectLink: queryParams?.['project-link'] as string,
                projectInvite: queryParams?.['project-invite'] as string,
                poseId: queryParams?.['poseId'] as string,
            };
        } catch (error) {
            return null;
        }
    }, []);

    const handleDeepLink = useCallback((params: DeepLinkParams) => {

        // Handle project-link parameter
        if (params.projectLink) {
            dispatch(updateInviteId(`bulk:${params.projectLink}`));
        } 
        // Handle project-invite parameter
        else if (params.projectInvite) {
            dispatch(updateInviteId(`email:${params.projectInvite}`));
        }
    }, [navigation]);

    const processInitialURL = useCallback(async () => {
        // Prevent processing initial URL multiple times
        if (hasHandledInitialUrl.current) {
            return;
        }

        try {
            const initialUrl = await Linking.getInitialURL();
            
            if (initialUrl) {
                hasHandledInitialUrl.current = true;
                const params = parseDeepLink(initialUrl);
                
                if (params && (params.projectLink || params.projectInvite || params.poseId)) {
                    // Wait a bit for navigation to be ready
                    setTimeout(() => {
                        handleDeepLink(params);
                    }, 1000);
                } else {
                }
            } else {
            }
        } catch (error) {
            console.error('Error getting initial URL:', error);
        }
    }, [parseDeepLink, handleDeepLink]);

    const handleUrlChange = useCallback(({ url }: { url: string }) => {
        const params = parseDeepLink(url);
        
        if (params && (params.projectLink || params.projectInvite || params.poseId)) {
            handleDeepLink(params);
        } else {
        }
    }, [parseDeepLink, handleDeepLink]);

    // Handle app coming to foreground
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            // App is coming to foreground from background
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                // Check for any pending deep links when app comes to foreground
                processInitialURL();
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [processInitialURL]);

    // Handle initial URL and URL changes
    useEffect(() => {
        
        // Handle initial URL when app is opened from a deep link
        processInitialURL();

        // Handle URL changes when app is already running
        const subscription = Linking.addEventListener('url', handleUrlChange);

        return () => {
            subscription?.remove();
        };
    }, [processInitialURL, handleUrlChange]);

    return {
        parseDeepLink,
        handleDeepLink,
    };
};