import { createCustomBulkIntervention } from '@shared-core/fetchApi/api.fetch';
import { convertGeometry } from './geojsonUtils';
import { Intervention, UploadRecord, UploadResult } from '../types';

function isErrorResponse(res: any): boolean {
    return res?.code !== 'success' && (
        res?.code === 'http_error' || res?.code === 'network_error' || res?.code === 'client_fetch_error' || res?.statusCode >= 400
    );
}

function buildPayload(interventions: Intervention[], siteId: string | undefined) {
    return {
        siteId: siteId || undefined,
        interventions: interventions.map(inv => ({
            beneficiary: inv.beneficiary,
            plantDate: inv.plantDate,
            species: inv.species.map(s => ({ name: s.name, count: s.count })),
            geometry: convertGeometry(inv.geojson),
        })),
    };
}

export async function uploadInterventions(
    interventions: Intervention[],
    token: string,
    projectId: string,
    siteId: string | undefined,
    onProgress: (current: number, total: number) => void,
): Promise<UploadResult> {
    onProgress(0, interventions.length);

    let response: any;
    try {
        const payload = buildPayload(interventions, siteId);
        response = await createCustomBulkIntervention(token, payload, projectId);
    } catch (err: any) {
        return allFailed(interventions, err?.message ?? 'Request failed');
    }

    if (isErrorResponse(response)) {
        const errMsg = response?.data?.message ?? response?.message ?? 'Upload failed';
        return allFailed(interventions, errMsg);
    }

    onProgress(interventions.length, interventions.length);

    const data = response?.data ?? response;
    const passed: number = data?.passed ?? 0;
    const failed: number = data?.failed ?? 0;
    const failedItems: { uid: string; error: string }[] = data?.failedInterventionUid ?? [];

    const errorRecords: UploadRecord[] = failedItems.map((f, i) => ({
        intervention: interventions[i] ?? interventions[0],
        error: f.error,
    }));

    return {
        totalProcessed: data?.totalProcessed ?? interventions.length,
        successCount: passed,
        errorCount: failed,
        successRecords: [],
        errorRecords,
    };
}

function allFailed(interventions: Intervention[], error: string): UploadResult {
    return {
        totalProcessed: interventions.length,
        successCount: 0,
        errorCount: interventions.length,
        successRecords: [],
        errorRecords: interventions.map(inv => ({ intervention: inv, error })),
    };
}
