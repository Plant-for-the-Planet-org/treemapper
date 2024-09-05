import moment from "moment";
import { InterventionData, Inventory, PlantedSpecies, SampleTree } from "src/types/interface/slice.interface";
import { INTERVENTION_TYPE } from "src/types/type/app.type";
import { generateUniquePlotId } from "../monitoringPlotHelper/monitoringRealmHelper";
import { createNewInterventionFolder } from "../fileManagementHelper";
import * as FileSystem from 'expo-file-system';

function dateStringToTimestamp(dateString) {
    return moment(dateString).valueOf();
}


const interventionTittleSwitch = (t: string): {
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
const getCoordinatesAndType = (inventory: Inventory) => {
    if (inventory?.polygons[0]) {
        const coords = inventory.polygons[0].coordinates;
        // stores the coordinates of the registered tree(s)
        const coordinates = coords.map(x => [x.longitude, x.latitude]);
        const coordinatesType = coordinates.length > 1 ? 'Polygon' : 'Point';
        return {
            poly: coordinatesType === 'Polygon' ? [coordinates] : [],
            point: coordinatesType === 'Point' ? coordinates[0] : [],
            coordinatesType,
            complete: true,
            imageUrl: coordinatesType === 'Point' ? `${FileSystem.documentDirectory}${inventory.polygons[0].coordinates[0].imageUrl}` : '',
            cdnURL: coordinatesType === 'Point' ? inventory.polygons[0].coordinates[0].cdnImageUrl : '',
        };
    }
    return {
        poly: [],
        point: [],
        coordinatesType: 'Point',
        complete: false,
        imageUrl: "",
        cdnURL: '',
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

const getSpeciesData = (s: any) => {
    if (!s && s.length === 0) {
        return {
            complete: false,
            "aliases": "",
            "treeCount": 1,
            "id": ""
        }
    }
    if (!s[0].aliases || !s[0].id) {
        return {
            complete: false,
            "aliases": "",
            "treeCount": 1,
            "id": ""
        }
    }
    return {
        complete: false,
        "aliases": s[0].aliases,
        "treeCount": 1,
        "id": s[0].id
    }
}

const getDeviceLocation = (appMetadata: string) => {
    try {
        if (typeof appMetadata === 'string') {
            const parsedData = JSON.parse(appMetadata);
            if (parsedData?.deviceLocation?.coordinates) {
                return {
                    lat: parsedData?.deviceLocation.coordinates[1],
                    long: parsedData?.deviceLocation.coordinates[0]
                }
            }
        }
        throw new Error("");
    } catch (error) {
        return {
            lat: 0,
            long: 0,
        }
    }
}

const singleTreeDetails = (d: any): SampleTree => {
    try {
        const speciesData = getSpeciesData(d.species)
        const tid = generateUniquePlotId()
        const locDetails = getCoordinatesAndType(d)
        const dlocation = getDeviceLocation(d.appMetadata)
        const details: SampleTree = {
            tree_id: tid,
            species_guid: speciesData.id,
            intervention_id: d.inventory_id,
            count: 1,
            latitude: locDetails.point[1],
            longitude: locDetails.point[0],
            device_longitude: dlocation.long,
            location_accuracy: '',
            image_url: locDetails.imageUrl,
            cdn_image_url: locDetails.cdnURL || '',
            specie_name: speciesData.aliases,
            local_name: speciesData.aliases,
            specie_diameter: d.specieDiameter,
            specie_height: d.specieHeight,
            tag_id: d.tagId || '',
            plantation_date: dateStringToTimestamp(d.plantation_date),
            status_complete: true,
            location_id: d.locationId || '',
            tree_type: d.treeType === 'sample' ? 'sample' : 'single',
            additional_details: '', //todo
            app_meta_data: JSON.stringify(d.appMetadata),
            hid: d.hid || '',
            device_latitude: dlocation.lat,
            sloc_id: '',
            parent_id: d.parent || '',
            history: [],
            status: "INITIALIZED",
            remeasurement_dates: {
                sampleTreeId: tid,
                created: dateStringToTimestamp(d.plantation_date),
                lastMeasurement: 0,
                remeasureBy: 0,
                nextMeasurement: 0
            },
            is_alive: true,
            remeasurement_requires: false,
            image_data: {
                latitude: locDetails.point[1],
                longitude: locDetails.point[0],
                imageUrl: locDetails.imageUrl,
                cdnImageUrl: locDetails.cdnURL,
                currentloclat: 0,
                currentloclong: 0,
                isImageUploaded: false,
                coordinateID: ""
            },
            fix_required: "NO"
        }
        return details

    } catch (error) {
        return null
    }

}


const migrateSampleTree = (d: any, pId: string): SampleTree => {
    try {
        const tid = generateUniquePlotId()
        const details: SampleTree = {
            tree_id: tid,
            species_guid: d.specieId,
            intervention_id: pId,
            count: 1,
            latitude: d.latitude,
            longitude: d.longitude,
            device_longitude: d.deviceLongitude,
            location_accuracy: '',
            image_url: `${FileSystem.documentDirectory}${d.imageUrl}`,
            cdn_image_url: d.cdnImageUrl || '',
            specie_name: d.specieName,
            local_name: d.specieName,
            specie_diameter: d.specieDiameter,
            specie_height: d.specieHeight,
            tag_id: d.tagId || '',
            plantation_date: dateStringToTimestamp(d.plantationDate),
            status_complete: true,
            location_id: d.locationId || '',
            tree_type: 'sample',
            additional_details: '', //todo
            app_meta_data: JSON.stringify(d.appMetadata),
            hid: d.hid || '',
            device_latitude: d.deviceLatitude,
            sloc_id: '',
            parent_id: d.parent || '',
            history: [],
            status: "INITIALIZED",
            remeasurement_dates: {
                sampleTreeId: tid,
                created: dateStringToTimestamp(d.plantationDate),
                lastMeasurement: 0,
                remeasureBy: 0,
                nextMeasurement: 0
            },
            is_alive: true,
            remeasurement_requires: false,
            image_data: {
                latitude: d.latitude,
                longitude: d.longitude,
                imageUrl: `${FileSystem.documentDirectory}${d.imageUrl}`,
                cdnImageUrl: d.cdnURL,
                currentloclat: 0,
                currentloclong: 0,
                isImageUploaded: false,
                coordinateID: ""
            },
            fix_required: "NO"
        }
        return details

    } catch (error) {
        return null
    }

}


export const migrateInventoryToIntervention = async (inventory: Inventory): Promise<InterventionData | null> => {
    try {
        const result = await createNewInterventionFolder(inventory.inventory_id)
        if (!result) {
            throw new Error("Error creating folder");
        }
        const extraData = interventionTittleSwitch(inventory.treeType);
        const locDetails = getCoordinatesAndType(inventory);
        const sample_trees: SampleTree[] = [];
        if (extraData.key !== 'single-tree-registration') {
            inventory.sampleTrees.forEach(element => {
                sample_trees.push(migrateSampleTree(element,inventory.inventory_id));
            });
        } else {
            sample_trees.push(singleTreeDetails(inventory));
        }
        const interventionData: InterventionData = {
            intervention_id: inventory.inventory_id,
            intervention_key: extraData.key,
            intervention_title: extraData.title,
            intervention_date: dateStringToTimestamp(inventory.plantation_date),
            project_id: inventory.projectId ? inventory.projectId : '',
            project_name: "",
            site_name: "",
            location_type: locDetails.coordinatesType,
            location: {
                type: locDetails.coordinatesType,
                coordinates: locDetails.coordinatesType === 'Polygon' ? JSON.stringify(locDetails.poly[0]) : JSON.stringify([locDetails.point]),
            },
            has_species: true,
            has_sample_trees: extraData.hasSampleTrees,
            sample_trees: sample_trees,
            is_complete: false,
            site_id: "",
            intervention_type: extraData.key,
            form_data: [],
            additional_data: [],
            meta_data: "{}",
            status: "INITIALIZED",
            hid: "",
            coords: {
                type: "Point",
                coordinates: locDetails.coordinatesType === 'Point' ? locDetails.point : locDetails.poly[0][0],
            },
            entire_site: false,
            last_screen: 'DYNAMIC_FORM',
            planted_species: setPlantedSpecies(inventory.species || []),
            form_id: inventory.inventory_id,
            image: "",
            image_data: [],
            location_id: inventory.locationId || '',
            locate_tree: "",
            remeasurement_required: false,
            next_measurement_date: 0,
            intervention_end_date: 0,
            fix_required: "NO",
            is_legacy: true
        };

        return interventionData;
    } catch (error) {
        return null
    }
};
