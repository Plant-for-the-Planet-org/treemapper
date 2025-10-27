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
            console.log('Parsing deep link:', url);
            const parsed = Linking.parse(url);
            const { queryParams } = parsed;
            
            console.log('Parsed URL:', parsed);
            console.log('Query params:', queryParams);

            return {
                projectLink: queryParams?.['project-link'] as string,
                projectInvite: queryParams?.['project-invite'] as string,
                poseId: queryParams?.['poseId'] as string,
            };
        } catch (error) {
            console.error('Error parsing deep link:', error);
            return null;
        }
    }, []);

    const handleDeepLink = useCallback((params: DeepLinkParams) => {
        console.log('Handling deep link with params:', params);

        // Handle project-link parameter
        if (params.projectLink) {
            console.log('Navigating to project with link:', params.projectLink);
            dispatch(updateInviteId(`bulk:${params.projectLink}`));
        } 
        // Handle project-invite parameter
        else if (params.projectInvite) {
            console.log('Navigating to project invite:', params.projectInvite);
            dispatch(updateInviteId(`email:${params.projectLink}`));
        }
    }, [navigation]);

    const processInitialURL = useCallback(async () => {
        // Prevent processing initial URL multiple times
        if (hasHandledInitialUrl.current) {
            console.log('Initial URL already handled, skipping...');
            return;
        }

        try {
            const initialUrl = await Linking.getInitialURL();
            console.log('Initial URL:', initialUrl);
            
            if (initialUrl) {
                hasHandledInitialUrl.current = true;
                const params = parseDeepLink(initialUrl);
                
                if (params && (params.projectLink || params.projectInvite || params.poseId)) {
                    // Wait a bit for navigation to be ready
                    setTimeout(() => {
                        handleDeepLink(params);
                    }, 1000);
                } else {
                    console.log('No valid params found in initial URL');
                }
            } else {
                console.log('No initial URL found');
            }
        } catch (error) {
            console.error('Error getting initial URL:', error);
        }
    }, [parseDeepLink, handleDeepLink]);

    const handleUrlChange = useCallback(({ url }: { url: string }) => {
        console.log('URL changed:', url);
        const params = parseDeepLink(url);
        
        if (params && (params.projectLink || params.projectInvite || params.poseId)) {
            handleDeepLink(params);
        } else {
            console.log('No valid params found in URL change');
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
                console.log('App came to foreground, checking for pending deep links...');
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
        console.log('Setting up deep linking listeners...');
        
        // Handle initial URL when app is opened from a deep link
        processInitialURL();

        // Handle URL changes when app is already running
        const subscription = Linking.addEventListener('url', handleUrlChange);

        return () => {
            console.log('Cleaning up deep linking listeners...');
            subscription?.remove();
        };
    }, [processInitialURL, handleUrlChange]);

    return {
        parseDeepLink,
        handleDeepLink,
    };
};