// import i18next from 'src/locales/index'
import { INTERVENTION_TYPE } from 'src/types/type/app.type'



export const interventionHeader = (key: INTERVENTION_TYPE): string => {
    switch (key) {
        case 'single-tree-registration':
            return "Single Tree Plantation";
        case 'multi-tree-registration':
            return "Multi Tree Plantation";
        case 'removal-invasive-species':
            return "Removal of Invasive Species";
        case 'fire-suppression':
            return "Fire Suppression";
        case 'fire-patrol':
            return "Fire Patrol";
        case 'fencing':
            return "Fencing";
        case 'marking-regenerant':
            return "Marking Regenerant";
        case 'liberating-regenerant':
            return "Liberating Regenerant";
        case 'grass-suppression':
            return "Grass Suppression";
        case 'firebreaks':
            return "Firebreaks";
        case 'assisting-seed-rain':
            return "Assisting Seed Rain";
        case 'soil-improvement':
            return "Soil Improvement";
        case 'stop-tree-harvesting':
            return "Stop Tree Harvesting";
        case 'direct-seeding':
            return "Direct Seeding";
        case 'enrichment-planting':
            return "Enrichment Planting";
        case 'other-intervention':
            return "Other Intervention";
        case 'maintenance':
            return "Maintenance";
        default:
            return "Unknown Intervention";
    }
};