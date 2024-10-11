import moment from "moment"
import { History, InterventionData, PlantedSpecies, SampleTree } from "src/types/interface/slice.interface"
import { INTERVENTION_TYPE } from "src/types/type/app.type"
import { v4 as uuid } from 'uuid'
import { convertDateToTimestamp } from "../appHelper/dataAndTimeHelper"


export const getExtendedPageParam = (str: string) => {
    if (str.startsWith('/')) {
        return str.slice(1);
    }
    return str;
}



const interventionTittleSwitch = (t: INTERVENTION_TYPE): {
    title: string
    key: INTERVENTION_TYPE
    hasSampleTrees: boolean
} => {
    const interventions = {
        'single-tree-registration': { title: "Single Tree Plantation", hasSampleTrees: false },
        'multi-tree-registration': { title: "Multi Tree Plantation", hasSampleTrees: true },
        'fire-patrol': { title: "Fire Patrol", hasSampleTrees: false },
        'fire-suppression': { title: "Fire Suppression Team", hasSampleTrees: false },
        'firebreaks': { title: "Establish Fire Breaks", hasSampleTrees: false },
        'fencing': { title: "Fencing", hasSampleTrees: false },
        'removal-invasive-species': { title: "Removal of Invasive Species", hasSampleTrees: false },
        'direct-seeding': { title: "Direct Seeding", hasSampleTrees: false },
        'grass-suppression': { title: "Grass Suppression", hasSampleTrees: false },
        'marking-regenerant': { title: "Marking Regenerant", hasSampleTrees: true },
        'enrichment-planting': { title: "Enrichment Planting", hasSampleTrees: true },
        'liberating-regenerant': { title: "Liberating Regenerant", hasSampleTrees: false },
        'soil-improvement': { title: "Soil Improvement", hasSampleTrees: false },
        'assisting-seed-rain': { title: "Assisting Seed Rain", hasSampleTrees: false },
        'stop-tree-harvesting': { title: "Stop Tree Harvesting", hasSampleTrees: false },
        'maintenance': { title: "Maintenance", hasSampleTrees: false },
        'other-intervention': { title: "Other Intervention", hasSampleTrees: false }
    }

    return {
        title: interventions[t]?.title || "",
        key: t,
        hasSampleTrees: interventions[t]?.hasSampleTrees || false
    }
}


const getGeometry = (g: any) => {
    return {
        type: g.type,
        coordinates: g.type === 'Point' ? JSON.stringify([g.coordinates]) : JSON.stringify(g.coordinates[0]),
        geoSpatial: g.type === 'Point' ? [g.coordinates][0] : g.coordinates[0][0]
    }
}

const setPlantedSpecies = (s: any) => {
    if (s === null || !s) {
        return []
    }
    const finalData: PlantedSpecies[] = [];
    s.forEach(element => {
        if (element) {
            finalData.push({
                guid: element.scientificSpecies ? element.scientificSpecies : '',
                scientificName: element.scientificName ? element.scientificName : 'Undefined',
                aliases: element.otherSpecies ? element.otherSpecies : 'Undefined',
                count: element.treeCount ? element.treeCount : 1,
                image: ""
            })
        }
    });

    return finalData
}


const handlePlantHistory = (h: any, treeId: string) => {
    const finalHistory: History[] = []
    if (h) {
        h.forEach(element => {
            if (element.eventName == 'measurement') {
                finalHistory.push({
                    history_id: uuid(),
                    eventName: "measurement",
                    eventDate: convertDateToTimestamp(element.eventDate || new Date()),
                    imageUrl: element.image || '',
                    cdnImageUrl: element.image || '',
                    diameter: element.measurements.width || 0,
                    height: element.measurements.height || 0,
                    additionalDetails: undefined,
                    appMetadata: "",
                    status: "",
                    statusReason: "",
                    dataStatus: "SYNCED",
                    parentId: treeId,
                    samplePlantLocationIndex: 0,
                    lastScreen: ""
                })
            }
        });
    }
    return finalHistory
}


const remeasurementCalculator = (nextMeasurementDate: null | string | { date: string }) => {
    try {
        let timeStamp = 0;

        if (typeof nextMeasurementDate === 'string') {
            const utcDate = moment.utc(nextMeasurementDate);
            timeStamp = utcDate.valueOf();
        } else if (nextMeasurementDate && typeof nextMeasurementDate.date === 'string') {
            const utcDate = moment.utc(nextMeasurementDate.date);
            timeStamp = utcDate.valueOf();
        }

        if (timeStamp) {
            const date = moment(timeStamp);
            const currentDate = moment();
            const locationNeedRemeasurement = currentDate.isAfter(date);
            return { requireRemeasurement: locationNeedRemeasurement, d: timeStamp };
        }

        return { requireRemeasurement: false, d: 0 };
    } catch (error) {
        return { requireRemeasurement: false, d: 0 };
    }
}


const singleTreeDetails = (d: any): SampleTree => {
    const rData = remeasurementCalculator(d.nextMeasurementDate)
    const lData = remeasurementCalculator(d.lastMeasurementDate)
    const invStartDate = d.plantDate ? d.plantDate : d.interventionStartDate
    const details: SampleTree = {
        tree_id: d.id,
        species_guid: d.scientificSpecies || '',
        intervention_id: d.type !== 'sample-tree-registration' ? d.id : d.parent,
        count: 1,
        parent_id: d.type !== 'sample-tree-registration' ? d.id : d.parent,
        sloc_id: d.id,
        latitude: d.geometry.coordinates[1],
        longitude: d.geometry.coordinates[0],
        device_longitude: d.deviceLocation.coordinates[0],
        location_accuracy: "",
        image_url: "",
        cdn_image_url: d.coordinates[0].image || "",
        specie_name: d.scientificName || '',
        local_name: d.scientificName || '',
        specie_diameter: d.measurements.width,
        specie_height: d.measurements.height,
        tag_id: d.tag || '',
        plantation_date: moment(invStartDate).valueOf() || moment(d.registrationDate).valueOf() || 0,
        status_complete: false,
        location_id: d.id,
        tree_type: d.type === 'sample-tree-registration' ? 'sample' : 'single',
        additional_details: "",
        app_meta_data: "",
        status: "SYNCED",
        hid: d.hid,
        device_latitude: d.deviceLocation.coordinates[1],
        history: d.type === 'sample-tree-registration' ? handlePlantHistory(d.history, d.id) : [],
        remeasurement_requires: d.type === 'sample-tree-registration' ? rData.requireRemeasurement : false,
        is_alive: !d.status,
        remeasurement_dates: {
            sampleTreeId: "",
            created: moment(d.plantDate).valueOf() || moment(d.registrationDate).valueOf() || 0,
            lastMeasurement: lData.d,
            remeasureBy: 0,
            nextMeasurement: rData.d,
        },
        image_data: {
            latitude: d.geometry.coordinates[1],
            longitude: d.geometry.coordinates[0],
            imageUrl: "",
            cdnImageUrl: d.coordinates[0].image || "",
            currentloclat: 0,
            currentloclong: 0,
            isImageUploaded: true,
            coordinateID: ""
        },
        fix_required: "NO"
    }
    return details
}

const checkAndConvertMetaData = (m: any) => {
    if (m && m !== null) {
        return JSON.stringify(m)
    }
    return '{}'
}

const getEntireSiteCheck = (data: any) => {
    if (!!data && data?.public) {
        const publicData = data.public;
        if (typeof publicData === 'object' && publicData !== null && !Array.isArray(publicData)) {
            for (const key in publicData) {
                if (key == 'isEntireSite') {  // optional: ensure the property is not inherited
                    return true
                }
            }
        }
    }
    return false
}

export const convertInventoryToIntervention = (data: any): InterventionData => {
    const extraData = interventionTittleSwitch(data.type);
    const geometryData = getGeometry(data.geometry);
    const invStartDate = data.plantDate ? data.plantDate : data.interventionStartDate
    const sample_trees: SampleTree[] = []
    const rData = remeasurementCalculator(data.nextMeasurementDate)
    if (extraData.key !== 'single-tree-registration') {
        data.sampleInterventions.forEach(element => {
            sample_trees.push(singleTreeDetails(element))
        });
    } else {
        sample_trees.push(singleTreeDetails(data))
    }
    const metaData = data.metadata ? checkAndConvertMetaData(data.metadata) : '{}'
    let remeasurement_required = rData.requireRemeasurement
    const makeForRemeasurement = sample_trees.some(obj => obj.remeasurement_requires === true);
    if (makeForRemeasurement) {
        remeasurement_required = true
    }
    const finalData: InterventionData = {
        intervention_id: data.id,
        intervention_key: extraData.key,
        intervention_title: extraData.title,
        intervention_date: moment(invStartDate).valueOf() || moment(data.registrationDate).valueOf() || 0,
        project_id: data.plantProject || '',
        project_name: "",
        site_name: "",
        location_type: geometryData.type,
        location: geometryData,
        has_species: false,
        has_sample_trees: extraData.hasSampleTrees,
        sample_trees: sample_trees,
        is_complete: true,
        site_id: data.plantProjectSite || '',
        intervention_type: extraData.key,
        form_data: [],
        additional_data: [],
        meta_data: metaData,
        status: 'SYNCED',
        hid: data.hid || '',
        coords: {
            type: 'Point',
            coordinates: geometryData.geoSpatial
        },
        entire_site: getEntireSiteCheck(data.metadata || '{}'),
        last_screen: "PREVIEW",
        planted_species: setPlantedSpecies(data.plantedSpecies || []),
        form_id: data.id,
        image: "",
        image_data: [],
        location_id: data.id,
        locate_tree: "",
        remeasurement_required: extraData.key === 'single-tree-registration' ? false : remeasurement_required,
        next_measurement_date: extraData.key === 'single-tree-registration' ? 0 : rData.d,
        intervention_end_date: moment(data.interventionEndDate).valueOf() || moment(data.registrationDate).valueOf() || 0,
        fix_required: "NO"
    }
    return finalData
}