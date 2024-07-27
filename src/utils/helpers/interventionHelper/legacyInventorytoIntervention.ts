import moment from "moment"
import { InterventionData, PlantedSpecies, SampleTree } from "src/types/interface/slice.interface"
import { INTERVENTION_TYPE } from "src/types/type/app.type"



export const getExtendedPageParam = (str: string) => {
    if (str.startsWith('/')) {
        return str.slice(1);
    }
    return str;
}



const interventionTitlteSwitch = (t: string): {
    title: string
    key: INTERVENTION_TYPE
    hasSampleTrees: boolean
} => {
    switch (t) {
        case 'single':
            return {
                title: "Single Tree Plantation",
                key: 'single-tree-registration',
                hasSampleTrees: false
            }
        case 'multi':
        default:
            return {
                title: "Multi Tree Plantation",
                key: 'multi-tree-registration',
                hasSampleTrees: true
            }
    }
}

const getGeometry = (g: any) => {
    return {
        type: g.type,
        coordinates: g.type === 'Point' ? JSON.stringify([g.coordinates]) : JSON.stringify(g.coordinates[0]),
        geoSpatail: g.type === 'Point' ? [g.coordinates][0] : g.coordinates[0][0]
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



const remeasurementCalcultaor = (nextMeasurementDate: null | string | { date: string }) => {
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
    const rData = remeasurementCalcultaor(d.nextMeasurementDate)
    const lData = remeasurementCalcultaor(d.lastMeasurementDate)
    const details: SampleTree = {
        tree_id: d.id,
        species_guid: d.scientificSpecies || '',
        intervention_id: d.type === 'single' ? d.id : d.parent,
        count: 1,
        parent_id: d.type === 'single' ? d.id : d.parent,
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
        plantation_date: moment(d.plantDate).valueOf(),
        status_complete: false,
        location_id: d.id,
        tree_type: d.type,
        additional_details: "",
        app_meta_data: "",
        status: "SYNCED",
        hid: d.hid,
        device_latitude: d.deviceLocation.coordinates[1],
        history: [],
        remeasurement_requires: rData.requireRemeasurement,
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
        }
    }
    return details
}

const checkAndConvertMetaData = (m: any) => {
    if (m && m !== null) {
        return JSON.stringify(m)
    }
    return '{}'
}

export const convertInevtoryToIntervention = (data: any): InterventionData => {
    const extraData = interventionTitlteSwitch(data.type);
    const geometryData = getGeometry(data.geometry);
    const sample_trees: SampleTree[] = []
    const rData = remeasurementCalcultaor(data.nextMeasurementDate)
    if (extraData.key !== 'single-tree-registration') {
        data.samplePlantLocations.forEach(element => {
            sample_trees.push(singleTreeDetails(element))
        });
    } else {
        sample_trees.push(singleTreeDetails(data))
    }
    const metaData = data.metadata ? checkAndConvertMetaData(data.metadata) : '{}'
    let remeasuremnt_required = rData.requireRemeasurement
    const markeForRemeasurement = sample_trees.some(obj => obj.remeasurement_requires === true);
    if (markeForRemeasurement) {
        remeasuremnt_required = true
    }
    const finalData: InterventionData = {
        intervention_id: data.id,
        intervention_key: extraData.key,
        intervention_title: extraData.title,
        intervention_date: moment(data.registrationDate).valueOf() || moment(data.plantDate).valueOf(),
        project_id: data.plantProject || '',
        project_name: "",
        site_name: "",
        location_type: geometryData.type,
        location: geometryData,
        has_species: false,
        has_sample_trees: extraData.hasSampleTrees,
        sample_trees: sample_trees,
        is_complete: true,
        site_id: "",
        intervention_type: extraData.key,
        form_data: [],
        additional_data: [],
        meta_data: metaData,
        status: 'SYNCED',
        hid: data.hid || '',
        coords: {
            type: 'Point',
            coordinates: geometryData.geoSpatail
        },
        entire_site: false,
        last_screen: "PREVIEW",
        planted_species: setPlantedSpecies(data.plantedSpecies || []),
        form_id: data.id,
        image: "",
        image_data: [],
        location_id: data.id,
        locate_tree: "",
        remeasuremnt_required: remeasuremnt_required,
        next_measurement_date: rData.d
    }
    return finalData
}