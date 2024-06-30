import moment from "moment";
import { InterventionData, Inventory, PlantedSpecies, SampleTree } from "src/types/interface/slice.interface";
import { INTERVENTION_TYPE } from "src/types/type/app.type";
import { generateUniquePlotId } from "../monitoringPlotHelper/monitoringRealmHelper";

function dateStringToTimestamp(dateString) {
    return moment(dateString).valueOf();
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

const getCoordinatesAndType = (inventory: any) => {
    const coords = inventory.polygons[0].coordinates;

    // stores the coordinates of the registered tree(s)
    let coordinates = coords.map(x => [x.longitude, x.latitude]);
    const coordinatesType = coordinates.length > 1 ? 'Polygon' : 'Point';
    coordinates = coordinates.length > 1 ? [coordinates] : coordinates[0];
    return {
        coordinates,
        coordinatesType,
    };
};

const setPlantedSpecies = (s: any) => {
    if (s === null || !s) {
        return []
    }
    const finalData: PlantedSpecies[] = [];

    s.forEach(element => {
        if (element) {
            finalData.push({
                guid: element.id ? element.id : '',
                scientificName: element.aliases ? element.aliases : 'Undefined',
                aliases: element.aliases ? element.aliases : 'Undefined',
                count: element.treeCount ? element.treeCount : 1,
                image: ""
            })
        }
    });

    return finalData
}

const singleTreeDetails = (d: any): SampleTree => {
    const details: SampleTree = {
        tree_id: d.locationId || generateUniquePlotId(),
        species_guid: d.specieId,
        intervention_id: d.hid || '',
        count: 1,
        latitude: d.latitude,
        longitude: d.longitude,
        device_longitude: d.longitude,
        location_accuracy: String(d.locationAccuracy),
        image_url: d.imageUrl,
        cdn_image_url: d.cdnImageUrl,
        specie_name: d.specieName,
        local_name: d.specieName,
        specie_diameter: d.specieDiameter,
        specie_height: d.specieHeight,
        tag_id: d.tagId,
        plantation_date: dateStringToTimestamp(d.plantationDate),
        status_complete: d.status === 'PENDING_DATA_UPLOAD',
        location_id: d.locationId,
        tree_type: d.treeType === 'sample' ? 'sample' : 'single',
        additional_details: JSON.stringify(d.additionalDetails),
        app_meta_data: JSON.stringify(d.appMetadata),
        hid: d.hid,
        device_latitude: d.deviceLatitude
    }
    return details
}




export const convertInventoryToIntervention = (data: Inventory[]) => {
    const finalData: InterventionData[] = []
    for (let index = 0; index < data.length; index++) {
        const inventory = data[index];
        const extraData = interventionTitlteSwitch(inventory.treeType);
        const locDetails = getCoordinatesAndType(inventory)
        const sample_trees: SampleTree[] = []
        if (extraData.key !== 'single-tree-registration') {
            data[index].sampleTrees.forEach(element => {
                sample_trees.push(singleTreeDetails(element))
            });
        } else {
            sample_trees.push(singleTreeDetails(data[index]))
        }
        const interventionData: InterventionData = {
            intervention_id: inventory.inventory_id,
            intervention_key: extraData.key,
            intervention_title: extraData.title,
            intervention_date: dateStringToTimestamp(inventory.plantation_date),
            project_id: inventory.projectId,
            project_name: "",
            site_name: "",
            location_type: locDetails.coordinatesType,
            location: {
                type: locDetails.coordinatesType,
                coordinates: JSON.stringify(locDetails.coordinates)
            },
            cover_image_url: "",
            has_species: true,
            species: [],
            has_sample_trees: extraData.hasSampleTrees,
            sample_trees: sample_trees,
            is_complete: false,
            site_id: "",
            intervention_type: extraData.key,
            form_data: [],
            additional_data: [],
            meta_data: "",
            status: "SYNCED",
            hid: "",
            coords: {
                type: "Point",
                coordinates: locDetails.coordinatesType === 'Point' ? [locDetails.coordinates][0] : locDetails.coordinates[0][0]
            },
            entire_site: false,
            lastScreen: "",
            planted_species: setPlantedSpecies(data[index].species || [])
        }
        finalData.push(interventionData)
    }
    return finalData
}