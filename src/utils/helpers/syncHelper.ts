import moment from "moment";
import { InterventionData, QuaeBody, SampleTree } from "src/types/interface/slice.interface";
import { setUpIntervention } from "./formHelper/selectIntervention";
import { appRealm } from "src/db/RealmProvider";
import { RealmSchema } from "src/types/enum/db.enum";
import * as FileSystem from 'expo-file-system';

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
                if (el.hid !== '' && trees.sloc_id === '') {
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

export const getPostBody = async (r: QuaeBody) => {
    if (r.type === 'intervention') {
        const InterventionD = appRealm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, r.p1Id);
        return convertInterventionBody(JSON.parse(JSON.stringify(InterventionD)))
    }
    if (r.type === 'singleTree') {
        const SingleTree = appRealm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, r.p1Id);
        return convertTreeToBody(JSON.parse(JSON.stringify(SingleTree)), JSON.parse(JSON.stringify(SingleTree.sample_trees[0])))
    }
    if (r.type === 'sampleTree') {
        const TreeDetails = appRealm.objectForPrimaryKey<SampleTree>(RealmSchema.TreeDetail, r.p2Id);
        const Intervention = appRealm.objectForPrimaryKey<InterventionData>(RealmSchema.Intervention, TreeDetails.intervention_id);
        if (Intervention.location_id === '') {
            return null
        }
        return convertTreeToBody(Intervention, TreeDetails)
    }
    if (r.type === 'treeImage') {
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
        return body
    }
}

export const convertInterventionBody = (d: InterventionData) => {
    const metaData = JSON.parse(d.meta_data);
    const interventionForm = setUpIntervention(d.intervention_key)
    const postData: any = {
        type: d.intervention_type,
        captureMode: "on-site",
        deviceLocation: metaData.app.deviceLocation,
        geometry: {
            type: d.location_type,
            coordinates: d.location_type === 'Point' ? JSON.parse(d.location.coordinates) : [JSON.parse(d.location.coordinates)]
        },
        registrationDate: postTimeConvertor(d.intervention_date),
        metadata: {
            public: [metaData.public],
            private: [metaData.private],
            app: metaData.app
        },
    }
    if (d.project_id) {
        postData.plantProject = d.project_id
    }
    if (d.site_id && d.site_id !== 'other') {
        postData.plantProjectSite = d.site_id
    }
    if (interventionForm.species_required) {
        const planted_species = d.planted_species.map(el => {
            const species: any = {}
            species.treeCount = el.count
            if (el.guid === 'undefined') {
                species.otherSpecies = "Unknown"
            } else {
                species.scientificSpecies = el.guid
            }
            return species;
        })
        postData.plantedSpecies = planted_species
    }
    if (d.sample_trees.length > 0) {
        postData.sampleTreeCount = d.sample_trees.length
    }
    return postData
}

export const convertTreeToBody = (i: InterventionData, d: SampleTree) => {
    const metaData = JSON.parse(i.meta_data);
    const postData: any = {
        type: i.intervention_type === 'single-tree-registration' ? 'single-tree-registration' : 'sample-tree-registration',
        captureMode: "on-site",
        deviceLocation: metaData.app.deviceLocation,
        geometry: {
            type: 'Point',
            coordinates: [d.longitude, d.latitude]
        },
        registrationDate: postTimeConvertor(d.plantation_date),
        metadata: {
            public: [metaData.public],
            private: [metaData.private],
            app: metaData.app
        },
        measurements: {
            height: d.specie_height,
            width: d.specie_diameter
        },
    }
    if (i.project_id) {
        postData.plantProject = i.project_id
    }
    if (i.site_id && i.site_id !== 'other') {
        postData.plantProjectSite = i.site_id
    }
    if (d.species_guid === 'undefined') {
        postData.otherSpecies = d.species_guid
    } else {
        postData.scientificSpecies = d.species_guid
    }
    if (d.tree_type === 'sample') {
        postData.parent = i.location_id
    }
    if (d.tag_id) {
        postData.tag = d.tag_id
    }

    return postData
}