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
        coordinates: g.type === 'Point' ? JSON.stringify([g.coordinates]) : JSON.stringify(g.coordinates[0]),
        geoSpatail: g.type === 'Point' ? [g.coordinates][0] : g.coordinates[0][0]
    }
}


// const speciesData = (s: any) => {
//     if (s === null || !s) {
//         return []
//     }
//     const finalData = [];
//     for (let index = 0; index < s.length; index++) {
//         if (s[index] && s[index].scientificSpecies) {
//             finalData.push(s[index].scientificSpecies)
//         }
//     }
//     return finalData
// }


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
        hid: d.hid,
        device_latitude: d.deviceLocation.coordinates[1],
        history: [],
        remeasurement_requires:d.nextMeasurementDate?true:false,
        remeasurement_dates: {
            sampleTreeId: "",
            created: 0,
            lastMeasurement: d.nextMeasurementDate? moment(d.nextMeasurementDate.date, "YYYY-MM-DD HH:mm:ss.SSSSSS").valueOf():0,
            remeasureBy: 0,
            nextMeasurement: d.nextMeasurementDate? moment(d.nextMeasurementDate.date, "YYYY-MM-DD HH:mm:ss.SSSSSS").valueOf():0,
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

// const getAdditionalData = (d: any) => {
//     const deviceLocation = {
//         label: "Device Location",
//         value: ""
//     };
//     const hid = {
//         label: "HID",
//         value: ""
//     }
//     if (d && d.deviceLocation && d.deviceLocation.coordinates) {
//         if (d.deviceLocation.coordinates[0] && d.deviceLocation.coordinates[1]) {
//             deviceLocation.value = `${d.deviceLocation.coordinates[0].toFixed(6)},${d.deviceLocation.coordinates[1].toFixed(6)}`
//         }
//     }
//     if (d && d.hid) {
//         hid.value = d.hid
//     }
//     return JSON.stringify({
//         deviceLocation,
//         hid
//     })
// }





export const convertInevtoryToIntervention = (data: any): InterventionData => {
    const extraData = interventionTitlteSwitch(data.type);
    const geometryData = getGeometry(data.geometry);
    const sample_trees: SampleTree[] = []
    if (extraData.key !== 'single-tree-registration') {
        data.samplePlantLocations.forEach(element => {
            sample_trees.push(singleTreeDetails(element))
        });
    } else {
        sample_trees.push(singleTreeDetails(data))
    }
    const metaData = data.metadata ? checkAndConvertMetaData(data.metadata) : '{}'
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
        has_species: false,
        has_sample_trees: extraData.hasSampleTrees,
        sample_trees: sample_trees,
        is_complete: true,
        site_id: "",
        intervention_type: extraData.key,
        form_data: [],
        additional_data: [],
        meta_data: metaData,
        status: 'SYNCED',//todo check for this condition everywhere before moifying it.
        hid: data.hid || '',
        coords: {
            type: 'Point',
            coordinates: geometryData.geoSpatail
        },
        entire_site: false,
        last_screen: "PREVIEW",//todo change this when writing migration code
        planted_species: setPlantedSpecies(data.plantedSpecies || []),
        form_id: data.id,
        image: "",
        image_data: {
            latitude: 0,
            longitude: 0,
            imageUrl: "",
            cdnImageUrl: "",
            currentloclat: 0,
            currentloclong: 0,
            isImageUploaded: false,
            coordinateID: ""
        },
        location_id: data.id,
        locate_tree: "",
        registration_date: moment(data.plantDate).valueOf() || 0,
        remeasuremnt_required: data.nextMeasurementDate?true:false,
        next_measurement_date:  data.nextMeasurementDate? moment(data.nextMeasurementDate.date, "YYYY-MM-DD HH:mm:ss.SSSSSS").valueOf():0,
    }
    return finalData
}