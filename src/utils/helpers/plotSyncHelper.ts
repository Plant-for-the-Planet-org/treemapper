import moment from "moment";
import { BodyPayload, InterventionData, MonitoringPlot, PlotQuaeBody, QuaeBody, SampleTree } from "src/types/interface/slice.interface";
import * as turf from '@turf/turf';
import { appRealm } from "src/db/RealmProvider";
import { RealmSchema } from "src/types/enum/db.enum";
import * as FileSystem from 'expo-file-system';
import { FormElement } from "src/types/interface/form.interface";
import { updateFilePath } from "./fileSystemHelper";
import sampleTreeBase64 from '../../../assets/images/base64/sampleTree'


const postTimeConvertor = (t: number) => {
    return moment(t).format('YYYY-MM-DD')
}

/**
 * Finds the center of a polygon based on its shape type and geometry
 * @param {Object} feature - GeoJSON Feature containing the polygon
 * @param {string} shape - Shape type ('rectangle', 'square', or 'circle')
 * @returns {Array} Center coordinates [longitude, latitude]
 */
function findPolygonCenter(feature, shape) {
    if (!feature || !feature.geometry || feature.geometry.type !== 'Polygon') {
        throw new Error('Invalid input: Feature must be a GeoJSON Polygon');
    }

    if (!['rectangle', 'square', 'circular'].includes(shape.toLowerCase())) {
        throw new Error('Invalid shape type: Must be rectangle, square, or circle');
    }

    switch (shape.toLowerCase()) {
        case 'circular': {
            // For circles, use turf.center as it will find the center of mass
            const center = turf.center(feature);
            return center.geometry.coordinates;
        }

        case 'rectangle':
        case 'square': {
            // For rectangles and squares, we can use the bounding box center
            // This is more accurate than center of mass for these shapes
            const bbox = turf.bbox(feature);
            const centerLong = (bbox[0] + bbox[2]) / 2;
            const centerLat = (bbox[1] + bbox[3]) / 2;
            return [centerLong, centerLat];
        }
    }
}

const getImageAsBase64 = async (fileUri: string) => {
    try {
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        return base64;
    } catch (error) {
        return sampleTreeBase64;
    }
};



export const postPlotConvertor = (d: MonitoringPlot[]) => {
    const quae: PlotQuaeBody[] = []
    d.forEach(plot => {
        if(plot.status==='UPLOAD_PLOT'){
            quae.push({
                type: 'plot_upload',
                priority: 1,
                nextStatus: 'SYNCED',
                p1Id: plot.plot_id,
                p2Id: '',
            })
        }
    });
    return quae
}

export const getPlotPostBody = async (r: PlotQuaeBody, uType: string): Promise<BodyPayload> => {

    if (r.type === 'plot_upload') {
        const PlotData = appRealm.objectForPrimaryKey<MonitoringPlot>(RealmSchema.MonitoringPlot, r.p1Id);
        return convertPlotBody(JSON.parse(JSON.stringify(PlotData)))
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
            const base64Image = await getImageAsBase64(updateFilePath(TreeDetails.image_url))
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

const plotShapeHelper = (p: MonitoringPlot)=>{
    if(p.shape==='RECTANGULAR'){
        return {
            "length": p.length,
            "width": p.width,
        }
    }
    return {
        "radius":p.radius
    }
}

const plotCenterFinder = (p: MonitoringPlot)=>{
    const center = findPolygonCenter(
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
              "coordinates": JSON.parse(p.location.coordinates),
              "type": "Polygon"
            }
          
    }, p.shape);

    return {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "coordinates": [...center],
          "type": "Point"
        }
      }
}


export const convertPlotBody = (d: MonitoringPlot): BodyPayload => {
    try {
        const plotDimensions = plotShapeHelper(d)
        const plotGeometry = plotCenterFinder(d)
        const postData: any = {
                "type": d.type.toLowerCase(),
                "shape": d.shape.toLocaleLowerCase(),
                "name": d.name,
                ...plotDimensions,
                "geometry": {...plotGeometry},
                "captureDate": postTimeConvertor(d.plot_created_at)
        }
        return { pData: postData, message: "", fixRequired: 'NO', error: "" }
    } catch (error) {
        return { pData: null, message: "Unknown error occurred, please check the data ", fixRequired: 'UNKNOWN', error: JSON.stringify(error) }
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
        }

        if (uType === 'tpo' && i.project_id) {
            postData.plantProject = i.project_id
        }

        if (uType === 'tpo'  && i.site_id && i.site_id !== 'other') {
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
        return { pData: null, message: "Unknown error occurred, please check the data ", fixRequired: 'UNKNOWN', error: JSON.stringify(error) }
    }
}

const handleAdditionalData = (aData: FormElement[]) => {
    const privateAdd = {}
    const publicAdd = {}
    aData.forEach(el => {
        if (el.visibility === 'private') {
            privateAdd[el.key] = {
                "key": el.key,
                "originalKey":el.element_id,
                "value":el.value,
                "label":el.label,
                "type":el.type,
                "unit":el.unit,
                "visibility":"private",
                "dataType":el.data_type,
                "elementType":"additionalData"
            };
        }
        if (el.visibility === 'public') {
            publicAdd[el.key] = {
                "key": el.key,
                "originalKey":el.element_id,
                "value":el.value,
                "label":el.label,
                "type":el.type,
                "unit":el.unit,
                "visibility":"public",
                "dataType":el.data_type,
                "elementType":"additionalData"
            };
        }
    })
    return { privateAdd, publicAdd }
}

export const convertRemeasurementBody = async (d: SampleTree): Promise<BodyPayload> => {
    try {
        const getHistory = d.history.find(el => el.dataStatus === 'REMEASUREMENT_DATA_UPLOAD')
        const base64Image = await getImageAsBase64(updateFilePath(d.image_url))
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

