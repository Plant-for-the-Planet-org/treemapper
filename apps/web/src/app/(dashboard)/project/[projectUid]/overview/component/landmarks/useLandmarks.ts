// Owns the landmark list for one project: initial fetch plus create, update
// and delete that keep the list in sync from each response.
import { useCallback, useEffect, useState } from 'react';
import {
    type Landmark,
    type LandmarkInput,
    fetchProjectLandmarks,
    createLandmark as createLandmarkApi,
    updateLandmark as updateLandmarkApi,
    deleteLandmark as deleteLandmarkApi,
} from './api';

export function useLandmarks(projectUid: string, token?: string) {
    const [landmarks, setLandmarks] = useState<Landmark[]>([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const list = await fetchProjectLandmarks(projectUid, token);
                if (!cancelled) setLandmarks(Array.isArray(list) ? list : []);
            } catch (err) {
                // Landmarks are supplementary; never block the map on them.
                console.warn('Failed to load landmarks:', err);
            }
        })();
        return () => { cancelled = true; };
    }, [projectUid, token]);

    const create = useCallback(async (input: LandmarkInput) => {
        const created = await createLandmarkApi(projectUid, input, token);
        setLandmarks(prev => [created, ...prev]);
        return created;
    }, [projectUid, token]);

    const update = useCallback(async (landmarkUid: string, input: Partial<LandmarkInput>) => {
        const updated = await updateLandmarkApi(projectUid, landmarkUid, input, token);
        setLandmarks(prev => prev.map(l => (l.uid === landmarkUid ? updated : l)));
        return updated;
    }, [projectUid, token]);

    const remove = useCallback(async (landmarkUid: string) => {
        await deleteLandmarkApi(projectUid, landmarkUid, token);
        setLandmarks(prev => prev.filter(l => l.uid !== landmarkUid));
    }, [projectUid, token]);

    return { landmarks, create, update, remove };
}
