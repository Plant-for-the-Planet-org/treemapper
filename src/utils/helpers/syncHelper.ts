import moment from "moment";
import { BodyPayload, InterventionData, QuaeBody, SampleTree } from "src/types/interface/slice.interface";
import { setUpIntervention } from "./formHelper/selectIntervention";
import { appRealm } from "src/db/RealmProvider";
import { RealmSchema } from "src/types/enum/db.enum";
import * as FileSystem from 'expo-file-system';
import { FormElement } from "src/types/interface/form.interface";

const postTimeConvertor = (t: number) => {
    return moment(t).format('YYYY-MM-DD')
}


const getImageAsBase64 = async (fileUri: string) => {
    try {
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        return base64;
    } catch (error) {
        console.error("Error reading file as base64:", error);
        throw error;
    }
};



export const postDataConvertor = (d: InterventionData[]) => {
    const quae: QuaeBody[] = []
    d.forEach(el => {
        if (el.intervention_key === 'single-tree-registration') {
            if (el.hid === '') {
                quae.push({
                    type: 'singleTree',
                    priority: 1,
                    nextStatus: 'PENDING_TREE_IMAGE',
                    p1Id: el.intervention_id,
                    p2Id: el.sample_trees[0].tree_id,
                })
            }
            if (el.status === 'PENDING_TREE_IMAGE') {
                quae.push({
                    type: 'treeImage',
                    priority: 3,
                    nextStatus: 'SYNCED',
                    p1Id: el.intervention_id,
                    p2Id: el.sample_trees[0].tree_id,
                })
            }
        } else {
            if (el.hid === '') {
                quae.push({
                    type: 'intervention',
                    priority: 1,
                    nextStatus: el.sample_trees.length !== 0 ? 'PENDING_SAMPLE_TREE' : 'SYNCED',
                    p1Id: el.intervention_id,
                })
            }
            el.sample_trees.forEach(trees => {
                if (trees.status === 'REMEASUREMENT_DATA_UPLOAD') {
                    quae.push({
                        type: 'remeasurementData',
                        priority: 1,
                        nextStatus: 'SYNCED',
                        p1Id: el.intervention_id,
                        p2Id: trees.tree_id,
                    })
                }
                if (trees.status === 'REMEASUREMENT_EVENT_UPDATE') {
                    quae.push({
                        type: 'remeasurementStatus',
                        priority: 1,
                        nextStatus: 'SYNCED',
                        p1Id: el.intervention_id,
                        p2Id: trees.tree_id,
                    })
                }
                if (trees.status === 'SKIP_REMEASUREMENT') {
                    quae.push({
                        type: 'skipRemeasurement',
                        priority: 1,
                        nextStatus: 'SYNCED',
                        p1Id: el.intervention_id,
                        p2Id: trees.tree_id,
                    })
                }
                if (el.status === 'PENDING_SAMPLE_TREE' && el.hid !== '' && trees.sloc_id === '') {
                    quae.push({
                        type: 'sampleTree',
                        priority: 2,
                        nextStatus: 'PENDING_TREE_IMAGE',
                        p1Id: el.intervention_id,
                        p2Id: trees.tree_id,
                    })
                }
                if (trees.status === 'PENDING_TREE_IMAGE') {
                    quae.push({
                        type: 'treeImage',
                        priority: 3,
                        nextStatus: 'SYNCED',
                        p1Id: el.intervention_id,
                        p2Id: trees.tree_id,
                    })
                }
            });
        }
    });
    return quae
}

export const getPostBody = async (r: QuaeBody, uType: string): Promise<BodyPayload> => {
    if (r.type === 'intervention') {
        const InterventionD = appRealm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, r.p1Id);
        return convertInterventionBody(JSON.parse(JSON.stringify(InterventionD)), uType)
    }
    if (r.type === 'singleTree') {
        const SingleTree = appRealm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, r.p1Id);
        return convertTreeToBody(JSON.parse(JSON.stringify(SingleTree)), JSON.parse(JSON.stringify(SingleTree.sample_trees[0])), uType)
    }
    if (r.type === 'sampleTree') {
        const TreeDetails = appRealm.objectForPrimaryKey<SampleTree>(RealmSchema.TreeDetail, r.p2Id);
        const Intervention = appRealm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, TreeDetails.intervention_id);
        if (Intervention.location_id === '') {
            return null
        }
        return convertTreeToBody(Intervention, TreeDetails, uType)
    }
    if (r.type === 'treeImage') {
        try {
            const TreeDetails = appRealm.objectForPrimaryKey<SampleTree>(RealmSchema.TreeDetail, r.p2Id);
            if (TreeDetails.sloc_id === '') {
                return null
            }
            const base64Image = await getImageAsBase64(TreeDetails.image_url)
            const body = {
                imageFile: `data:image/png;base64,${base64Image}`,
                locationId: TreeDetails.tree_type === 'sample' ? TreeDetails.sloc_id : TreeDetails.parent_id,
                imageId: TreeDetails.image_data.coordinateID
            };
            return { pData: body, message: '', fixRequired: "NO", error: "" }
        } catch (error) {
            return { pData: null, message: 'Image process failed.', fixRequired: "UNKNOWN", error: JSON.stringify(error) }
        }

    }
    return { pData: null, message: '', fixRequired: "NO", error: "" }
}


export const getRemeasurementBody = async (r: QuaeBody): Promise<BodyPayload> => {
    if (r.type === 'remeasurementData') {
        const TreeDetails = appRealm.objectForPrimaryKey<SampleTree>(RealmSchema.TreeDetail, r.p2Id);
        return convertRemeasurementBody(TreeDetails)
    }
    if (r.type === 'remeasurementStatus') {
        const TreeDetails = appRealm.objectForPrimaryKey<SampleTree>(RealmSchema.TreeDetail, r.p2Id);
        return convertRemeasurementStatus(TreeDetails)
    }
    return { pData: null, message: '', fixRequired: "NO", error: "" }
}

export const convertInterventionBody = (d: InterventionData, uType: string): BodyPayload => {
    try {
        const metaData = JSON.parse(d.meta_data);
        const additionalDataConvert = handleAdditionalData([...d.additional_data, ...d.form_data])
        const finalMeta = {
            app: {
                ...metaData.app
            },
            public: {
                ...additionalDataConvert.publicAdd,
                ...metaData.public
            },
            private: {
                ...additionalDataConvert.privateAdd,
                ...metaData.privateAdd
            }
        }
        const interventionForm = setUpIntervention(d.intervention_key)
        const postData: any = {
            type: d.intervention_type,
            captureMode: "on-site",
            deviceLocation: metaData.app.deviceLocation,
            geometry: {
                type: d.location.type,
                coordinates: d.location.type === 'Point' ? JSON.parse(d.location.coordinates)[0] : [JSON.parse(d.location.coordinates)]
            },
            registrationDate: postTimeConvertor(Date.now()),
            metadata: finalMeta,
        }
        if (uType === 'tpo' && !d.project_id) {
            return { pData: null, message: "Please assign a project to intervention", fixRequired: "PROJECT_ID_MISSING", error: "" }
        } else {
            postData.plantProject = d.project_id
        }

        if (d.site_id && d.site_id !== 'other') {
            postData.plantProjectSite = d.site_id
        }
        if (interventionForm.species_required) {
            const planted_species = d.planted_species.map(el => {
                const species: any = {}
                species.treeCount = el.count
                if (el.guid == "unknown") {
                    species.otherSpecies = "Unknown"
                } else {
                    species.scientificSpecies = el.guid
                }
                return species;
            })
            postData.plantedSpecies = planted_species
        }
        postData.interventionStartDate = postTimeConvertor(d.intervention_date)
        if (d.intervention_end_date) {
            postData.interventionEndDate = postTimeConvertor(d.intervention_end_date)
        } else {
            postData.interventionEndDate = postTimeConvertor(d.intervention_date)
        }
        if (d.sample_trees.length > 0) {
            postData.sampleTreeCount = d.sample_trees.length
        }
        return { pData: postData, message: "", fixRequired: 'NO', error: "" }
    } catch (error) {
        return { pData: null, message: "Unknown error ocurred, please check the data ", fixRequired: 'UNKNOWN', error: JSON.stringify(error) }
    }

}

export const convertTreeToBody = (i: InterventionData, d: SampleTree, uType: string): BodyPayload => {
    try {
        const metaData = JSON.parse(i.meta_data);
        const additionalDataConvert = handleAdditionalData([...i.additional_data, ...i.form_data])
        const finalMeta = {
            app: {
                ...metaData.app
            },
            public: {
                ...additionalDataConvert.publicAdd,
                ...metaData.public
            },
            private: {
                ...additionalDataConvert.privateAdd,
                ...metaData.privateAdd
            }
        }
        const postData: any = {
            type: i.intervention_type === 'single-tree-registration' ? 'single-tree-registration' : 'sample-tree-registration',
            captureMode: "on-site",
            deviceLocation: metaData.app.deviceLocation,
            geometry: {
                type: 'Point',
                coordinates: [d.longitude, d.latitude]
            },
            registrationDate: postTimeConvertor(Date.now()),
            metadata: finalMeta,
            measurements: {
                height: d.specie_height,
                width: d.specie_diameter
            },
        }
        postData.interventionStartDate = postTimeConvertor(d.plantation_date)
        postData.interventionEndDate = postTimeConvertor(d.plantation_date)
        if (uType === 'tpo' && !i.project_id) {
            return { pData: null, message: "Please assign a project to intervention", fixRequired: "PROJECT_ID_MISSING", error: "" }
        } else {
            postData.plantProject = i.project_id
        }

        if (i.site_id && i.site_id !== 'other') {
            postData.plantProjectSite = i.site_id
        }
        if (d.species_guid == "unknown") {
            postData.otherSpecies = "Unknown"
        } else {
            postData.scientificSpecies = d.species_guid
        }

        if (d.tree_type === 'sample') {
            postData.parent = i.location_id
        }
        if (d.tag_id) {
            postData.tag = d.tag_id
        }
        return { pData: postData, message: "", fixRequired: 'NO', error: "" }
    } catch (error) {
        return { pData: null, message: "Unknown error ocurred, please check the data ", fixRequired: 'UNKNOWN', error: JSON.stringify(error) }
    }
}


const handleAdditionalData = (aData: FormElement[]) => {
    const privateAdd = {}
    const publicAdd = {}
    aData.forEach(el => {
        if (el.visibility === 'private') {
            privateAdd[el.label] = el.value
        }
        if (el.visibility === 'public') {
            publicAdd[el.label] = el.value
        }
    })
    return { privateAdd, publicAdd }
}

export const convertRemeasurementBody = async (d: SampleTree): Promise<BodyPayload> => {
    try {
        const getHistory = d.history.find(el => el.dataStatus === 'REMEASUREMENT_DATA_UPLOAD')
        const base64Image = await getImageAsBase64(d.image_url)
        const postData: any = {
            "type": "measurement",
            "eventDate": postTimeConvertor(getHistory.eventDate),
            "measurements": {
                "height": d.specie_height,
                "width": d.specie_diameter,
            },
            imageFile: `data:image/png;base64,${base64Image}`,
            "metadata": getHistory.additionalDetails.length > 0 ? {
                "public": {
                    comment: getHistory.additionalDetails[0].value,
                },
                "app": {
                    deviceLocation: getHistory.additionalDetails[1].value,
                },
                "private": {
                    withinRange: getHistory.additionalDetails[2].value,
                }
            } : {}
        }
        return { pData: postData, message: "", fixRequired: 'NO', error: "", historyID: getHistory.history_id }
    } catch (error) {
        return { pData: null, message: "Unknown error ocurred, please check the data ", fixRequired: 'UNKNOWN', error: JSON.stringify(error) }
    }
}


export const convertRemeasurementStatus = async (d: SampleTree): Promise<BodyPayload> => {
    const getHistory = d.history.find(el => el.dataStatus === 'REMEASUREMENT_EVENT_UPDATE')
    try {
        const postData: any = {
            "type": "status",
            "eventDate": postTimeConvertor(getHistory.eventDate || Date.now()),
            "statusReason": getHistory.statusReason || '',
            "status": "dead",
            "metadata": getHistory.additionalDetails.length > 0 ? {
                "public": {
                    comment: getHistory.additionalDetails[0].value,
                },
                "app": {
                    deviceLocation: JSON.parse(getHistory.additionalDetails[1].value),
                },
                "private": {
                    withinRange: getHistory.additionalDetails[2].value,
                }
            } : {}
        }
        return { pData: postData, message: "", fixRequired: 'NO', error: "", historyID: getHistory.history_id }
    } catch (error) {
        return { pData: null, message: "Unknown error ocurred, please check the data ", fixRequired: 'UNKNOWN', error: JSON.stringify(error) }
    }
}

