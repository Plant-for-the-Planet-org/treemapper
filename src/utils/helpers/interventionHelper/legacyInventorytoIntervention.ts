import moment from "moment"
import { InterventionData, SampleTree } from "src/types/interface/slice.interface"
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
        case 'multi':
            return {
                title: "Multi Tree Plantation",
                key: 'multi-tree-registration',
                hasSampleTrees: true
            }
        case 'single':
            return {
                title: "Single Tree Plantation",
                key: 'single-tree-registration',
                hasSampleTrees: false
            }
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
        coordinates: g.type === 'Point' ? JSON.stringify([g.coordinates]) : JSON.stringify(g.coordinates[0])
    }
}


const speciesData = (s: any) => {
    if (s === null || !s) {
        return []
    }
    const finalData = [];
    for (let index = 0; index < s.length; index++) {
        if (s[index] && s[index].scientificSpecies) {
            finalData.push(s[index].scientificSpecies)
        }
    }
    return finalData
}


const singleTreeDetails = (d: any): SampleTree => {
    const details: SampleTree = {
        tree_id: d.id,
        species_guid: d.scientificSpecies || '',
        intervention_id: d.parent || d.id,
        count: 1,
        latitude: d.geometry.coordinates[1],
        longitude: d.geometry.coordinates[0],
        device_longitude: d.deviceLocation.coordinates[0],
        location_accuracy: "",
        image_url: "",
        cdn_image_url:d.coordinates[0].image,
        specie_name: d.scientificName || '',
        specie_diameter: d.measurements.width,
        specie_height: d.measurements.height,
        tag_id: d.tag || '',
        plantation_date: moment(d.plantDate).valueOf(),
        status_complete: false,
        location_id: d.id,
        tree_type: d.type,
        additional_details: "",
        app_meta_data: "",
        hid: d.hid,
        device_latitude: d.deviceLocation.coordinates[1],
    }
    return details
}

const checkAndConvertMetaData = (m: any) => {
    if (m && m !== null) {
        return JSON.stringify(m)
    }
    return ''
}

const getAdditionalData = (d: any) => {
    const deviceLocation = {
        label: "Device Location",
        value: ""
    };
    const hid = {
        label: "HID",
        value: ""
    }
    if (d && d.deviceLocation && d.deviceLocation.coordinates) {
        if (d.deviceLocation.coordinates[0] && d.deviceLocation.coordinates[1]) {
            deviceLocation.value = `${d.deviceLocation.coordinates[0].toFixed(6)},${d.deviceLocation.coordinates[1].toFixed(6)}`
        }
    }
    if (d && d.hid) {
        hid.value = d.hid
    }
    return JSON.stringify({
        deviceLocation,
        hid
    })
}





export const convertInevtoryToIntervention = (data: any): InterventionData => {
    const extraData = interventionTitlteSwitch(data.type);
    const geometryData = getGeometry(data.geometry);
    const sample_trees: SampleTree[] = []
    if (extraData.key!=='single-tree-registration') {
        data.samplePlantLocations.forEach(element => {
            sample_trees.push(singleTreeDetails(element))
        });
    }else{
        sample_trees.push(singleTreeDetails(data))
    }
    const metaData = data.metadata ? checkAndConvertMetaData(data.metadata) : ''
    const addtionData = getAdditionalData(data)

    const finalData: InterventionData = {
        intervention_id: data.id,
        intervention_key: extraData.key,
        intervention_title: extraData.title,
        intervention_date: moment(data.plantDate).valueOf() || 0,
        project_id: data.plantProject || '',
        project_name: "",
        site_name: "",
        location_type: geometryData.type,
        location: geometryData,
        cover_image_url: "",
        has_species: false,
        species: speciesData(data.plantedSpecies),
        has_sample_trees: extraData.hasSampleTrees,
        sample_trees: sample_trees,
        is_complete: true,
        site_id: "",
        intervention_type: extraData.key,
        form_data: "",
        additional_data: addtionData,
        meta_data: metaData,
        status: 'SYNCED',
        hid: data.hid || ''
    }
    return finalData
}