import moment from "moment"
import { History, InterventionData, PlantedSpecies, SampleTree } from "src/types/interface/slice.interface"
import { HISTORY_STATUS, INTERVENTION_TYPE } from "src/types/type/app.type"
import { v4 as uuid } from 'uuid'


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
    known: boolean
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

    const catalogue: Record<string, { title: string, hasSampleTrees: boolean } | undefined> = interventions
    const match = catalogue[t]
    return {
        // An unknown type keeps its own key, so nothing is misfiled, but it still
        // needs a readable title: the schema has no default for one, and an empty
        // string leaves a blank row in the list.
        title: match ? match.title : "Unknown Intervention",
        key: t,
        hasSampleTrees: match ? match.hasSampleTrees : false,
        known: !!match,
    }
}


/**
 * Realm stores a value only when it matches the type its schema declares, and a
 * rejected write loses the whole intervention. A server record can arrive with a
 * field missing, null, or in a shape the app did not expect, so every value goes
 * through one of these on the way in.
 *
 * Whatever had to be defaulted is written down in `fix_reason`, so the record
 * lands on the device and the user can see what is wrong with it instead of it
 * being dropped silently.
 */
const asText = (value: any, fallback = ''): string => {
    if (typeof value === 'string') return value
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
    return fallback
}

const asNumber = (value: any, fallback = 0): number => {
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
}

// Realm's 'int' rejects a fractional number, so a count is always rounded.
const asCount = (value: any, fallback = 1): number => Math.round(asNumber(value, fallback))

// Handing a malformed string straight to moment prints a deprecation warning
// with a full stack, and these records are exactly the ones full of malformed
// strings. ISO is tried strictly first, then plain Date, which fails quietly.
const parseDate = (candidate: any): number => {
    if (candidate instanceof Date) return candidate.getTime()
    if (typeof candidate === 'number') return candidate
    if (typeof candidate !== 'string') return NaN
    const iso = moment(candidate, moment.ISO_8601, true)
    if (iso.isValid()) return iso.valueOf()
    return new Date(candidate).getTime()
}

// The first candidate that reads as a real date wins. An empty candidate is
// skipped rather than parsed, because an empty date is not "now".
const asDate = (...candidates: any[]): number => {
    for (const candidate of candidates) {
        if (candidate === null || candidate === undefined || candidate === '') continue
        const parsed = parseDate(candidate)
        if (Number.isFinite(parsed)) return parsed
    }
    return 0
}

const asPosition = (value: any): number[] | null => {
    if (!Array.isArray(value) || value.length < 2) return null
    const longitude = Number(value[0])
    const latitude = Number(value[1])
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null
    return [longitude, latitude]
}

// Digs through Point, LineString, Polygon or MultiPolygon nesting for the first
// usable [lng, lat] pair, so a record with an unexpected geometry still has a
// place on the map instead of failing to convert.
const firstPosition = (value: any): number[] | null => {
    const direct = asPosition(value)
    if (direct) return direct
    if (!Array.isArray(value)) return null
    for (const child of value) {
        const found = firstPosition(child)
        if (found) return found
    }
    return null
}

// A ring needs at least three readable points to be worth drawing. Anything
// less falls back to a single point.
const asRing = (value: any): number[][] | null => {
    if (!Array.isArray(value)) return null
    const ring = value
        .map(asPosition)
        .filter((position): position is number[] => position !== null)
    return ring.length >= 3 ? ring : null
}


interface NormalisedGeometry {
    type: string
    coordinates: string
    geoSpatial: number[]
}

// An empty coordinates string is what a freshly created intervention carries
// before its location is drawn, and every screen already checks for it.
const MISSING_GEOMETRY: NormalisedGeometry = {
    type: 'Point',
    coordinates: '',
    geoSpatial: [],
}

const unwrapGeometry = (raw: any): any => {
    if (!raw || typeof raw !== 'object') return null
    if (raw.type === 'FeatureCollection') {
        const feature = Array.isArray(raw.features)
            ? raw.features.find((item: any) => item?.geometry)
            : null
        return feature?.geometry ?? null
    }
    if (raw.type === 'Feature') return raw.geometry ?? null
    return raw.type ? raw : null
}

/**
 * Everything is stored as a Point or a Polygon, because makeInterventionGeoJson
 * draws only those two and hands back an empty feature for anything else, which
 * then breaks the map. An unexpected geometry keeps its first point rather than
 * being thrown away.
 */
const getGeometry = (raw: any, issues: string[]): NormalisedGeometry => {
    const geometry = unwrapGeometry(raw)
    if (!geometry) {
        issues.push('Location is missing.')
        return MISSING_GEOMETRY
    }

    if (geometry.type === 'Point') {
        const position = asPosition(geometry.coordinates)
        if (position) {
            return {
                type: 'Point',
                coordinates: JSON.stringify([position]),
                geoSpatial: position,
            }
        }
    }

    if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
        const outer = geometry.type === 'Polygon'
            ? geometry.coordinates?.[0]
            : geometry.coordinates?.[0]?.[0]
        const ring = asRing(outer)
        if (ring) {
            if (geometry.type === 'MultiPolygon') {
                issues.push('This intervention has more than one area, and only the first one was kept.')
            }
            return {
                type: 'Polygon',
                coordinates: JSON.stringify(ring),
                geoSpatial: ring[0],
            }
        }
    }

    const fallback = firstPosition(geometry.coordinates)
    if (!fallback) {
        issues.push('Location is missing.')
        return MISSING_GEOMETRY
    }
    issues.push('Location could not be read in full and was saved as a single point.')
    return {
        type: 'Point',
        coordinates: JSON.stringify([fallback]),
        geoSpatial: fallback,
    }
}


const setPlantedSpecies = (s: any) => {
    if (!Array.isArray(s)) {
        return []
    }
    const finalData: PlantedSpecies[] = [];
    s.forEach(element => {
        if (element) {
            finalData.push({
                guid: asText(element.scientificSpecies),
                scientificName: asText(element.scientificName, 'Unknown'),
                aliases: asText(element.otherSpecies, 'Unknown'),
                count: asCount(element.treeCount, 1),
                image: ""
            })
        }
    });

    return finalData
}


const handlePlantHistory = (h: any, treeId: string, treeData: any) => {
    const finalHistory: History[] = []
    const status: HISTORY_STATUS = 'SYNCED'
    if (Array.isArray(h)) {
        h.forEach(element => {
            if (element?.eventName === 'measurement') {
                finalHistory.push({
                    history_id: uuid(),
                    eventName: "measurement",
                    eventDate: asDate(element.eventDate, Date.now()),
                    imageUrl: asText(element.image),
                    cdnImageUrl: asText(element.image),
                    diameter: asNumber(element.measurements?.width, 0),
                    height: asNumber(element.measurements?.height, 0),
                    additionalDetails: undefined,
                    appMetadata: "",
                    status: "",
                    statusReason: "",
                    dataStatus: status,
                    parentId: treeId,
                    samplePlantLocationIndex: 0,
                    lastScreen: ""
                })
            }
        });
    }
    if (treeData && treeData.status === 'dead') {
        finalHistory.push({
            history_id: uuid(),
            eventName: "status",
            eventDate: asDate(treeData.lastMeasurementDate, Date.now()),
            imageUrl: '',
            cdnImageUrl: '',
            diameter: asNumber(treeData.measurements?.width, 0),
            height: asNumber(treeData.measurements?.height, 0),
            additionalDetails: undefined,
            appMetadata: "",
            status: "dead",
            statusReason: asText(treeData.statusReason),
            dataStatus: status,
            parentId: treeId,
            samplePlantLocationIndex: 0,
            lastScreen: ""
        })
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

        if (Number.isFinite(timeStamp) && timeStamp) {
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


interface TreeParent {
    id: string
    position: number[]
    startDate: number
}

const singleTreeDetails = (d: any, index: number, parent: TreeParent, issues: string[]): SampleTree => {
    const tree = d || {}
    const rData = remeasurementCalculator(tree.nextMeasurementDate)
    const lData = remeasurementCalculator(tree.lastMeasurementDate)
    const isSample = tree.type === 'sample-tree-registration'
    const label = isSample ? `Tree ${index + 1}` : 'This tree'

    // The id is the Realm primary key, so it cannot be empty. The fallback is
    // built from the parent and the position in the list, which keeps it the
    // same every time this record is pulled again.
    const treeId = asText(tree.id) || `${parent.id}_tree_${index}`
    const parentId = asText(isSample ? tree.parent : tree.id) || parent.id

    let position = asPosition(unwrapGeometry(tree.geometry)?.coordinates)
        ?? firstPosition(unwrapGeometry(tree.geometry)?.coordinates)
    if (!position) {
        // Standing the tree at the intervention is closer to the truth than
        // [0, 0], which is a point in the ocean off Africa.
        position = parent.position.length === 2 ? parent.position : [0, 0]
        issues.push(`${label} has no location of its own.`)
    }

    const hasMeasurements = Number.isFinite(asNumber(tree.measurements?.width, NaN))
        || Number.isFinite(asNumber(tree.measurements?.height, NaN))
    if (!hasMeasurements) {
        issues.push(`${label} has no height or width recorded.`)
    }

    const speciesGuid = asText(tree.scientificSpecies)
    const speciesName = asText(tree.scientificName)
    if (!speciesGuid && !speciesName) {
        issues.push(`${label} has no species.`)
    }

    const imageUrl = asText(tree.coordinates?.[0]?.image) || asText(tree.image)

    const details: SampleTree = {
        tree_id: treeId,
        species_guid: speciesGuid,
        intervention_id: parentId,
        count: 1,
        parent_id: parentId,
        sloc_id: treeId,
        latitude: position[1],
        longitude: position[0],
        device_longitude: asNumber(tree.deviceLocation?.coordinates?.[0], 0),
        location_accuracy: "",
        image_url: "",
        cdn_image_url: imageUrl,
        specie_name: speciesName || 'Unknown',
        local_name: speciesName || 'Unknown',
        specie_diameter: asNumber(tree.measurements?.width, 0),
        specie_height: asNumber(tree.measurements?.height, 0),
        tag_id: asText(tree.tag),
        plantation_date: asDate(tree.plantDate, tree.interventionStartDate, tree.registrationDate, parent.startDate),
        status_complete: false,
        location_id: treeId,
        tree_type: isSample ? 'sample' : 'single',
        additional_details: "",
        app_meta_data: "",
        status: "SYNCED",
        hid: asText(tree.hid),
        device_latitude: asNumber(tree.deviceLocation?.coordinates?.[1], 0),
        history: isSample ? handlePlantHistory(tree.history, treeId, tree) : [],
        remeasurement_requires: isSample ? rData.requireRemeasurement : false,
        is_alive: !tree.status,
        remeasurement_dates: {
            sampleTreeId: "",
            created: asDate(tree.plantDate, tree.registrationDate, parent.startDate),
            lastMeasurement: lData.d,
            remeasureBy: 0,
            nextMeasurement: rData.d,
        },
        image_data: {
            latitude: position[1],
            longitude: position[0],
            imageUrl: "",
            cdnImageUrl: imageUrl,
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
    try {
        if (m && typeof m === 'object') {
            return JSON.stringify(m)
        }
        if (typeof m === 'string' && m.length > 0) {
            // Already stringified upstream. Parsed once to be sure the app can
            // read it back, because every screen does JSON.parse on this field.
            JSON.parse(m)
            return m
        }
    } catch (error) {
        // Unreadable metadata is dropped rather than carried forward, otherwise
        // the first screen that parses it crashes.
    }
    return '{}'
}

const getEntireSiteCheck = (data: any) => {
    if (!!data && data?.public) {
        const publicData = data.public;
        if (typeof publicData === 'object' && publicData !== null && !Array.isArray(publicData)) {
            for (const key in publicData) {
                if (key == 'isEntireSite') {  // optional: ensure the property is not inherited
                    if (publicData[key] === 'false' || publicData[key] === false) {
                        return false
                    }
                    return true
                }
            }
        }
    }
    return false
}

/**
 * Turns one server record into something Realm will accept.
 *
 * It returns null only when the record has no id, because that is the primary
 * key and there is nowhere to put the record without it. Every other problem is
 * filled with a safe default and listed in `fix_reason`, so the intervention
 * reaches the device and says what is wrong with it. Dropping the record instead
 * left the user with nothing to look at and no idea anything was missing.
 */
export const convertInventoryToIntervention = (data: any): InterventionData | null => {
    try {
        if (!data || typeof data !== 'object') {
            return null
        }
        const interventionId = asText(data.id)
        if (!interventionId) {
            return null
        }

        const issues: string[] = []
        const extraData = interventionTittleSwitch(asText(data.type) as INTERVENTION_TYPE);
        if (!extraData.known) {
            issues.push('This type of intervention is not recognised by the app.')
        }

        const geometryData = getGeometry(data.geometry, issues);
        const interventionDate = asDate(data.plantDate, data.interventionStartDate, data.registrationDate)
        if (!interventionDate) {
            issues.push('The date is missing.')
        }

        const projectId = asText(data.plantProject)
        if (!projectId) {
            issues.push('No project is assigned.')
        }

        const parent: TreeParent = {
            id: interventionId,
            position: geometryData.geoSpatial,
            startDate: interventionDate,
        }

        const sample_trees: SampleTree[] = []
        const rData = remeasurementCalculator(data.nextMeasurementDate)
        if (extraData.key !== 'single-tree-registration') {
            const serverTrees = Array.isArray(data.sampleInterventions) ? data.sampleInterventions : []
            serverTrees.forEach((element: any, index: number) => {
                sample_trees.push(singleTreeDetails(element, index, parent, issues))
            });
        } else {
            sample_trees.push(singleTreeDetails(data, 0, parent, issues))
        }

        const plantedSpecies = setPlantedSpecies(data.plantedSpecies)
        const metaData = checkAndConvertMetaData(data.metadata)
        let remeasurement_required = rData.requireRemeasurement
        const makeForRemeasurement = sample_trees.some(obj => obj.remeasurement_requires === true);
        if (makeForRemeasurement) {
            remeasurement_required = true
        }
        const finalData: InterventionData = {
            intervention_id: interventionId,
            intervention_key: extraData.key,
            intervention_title: extraData.title,
            intervention_date: interventionDate,
            project_id: projectId,
            project_name: "",
            site_name: "",
            location_type: geometryData.type,
            location: {
                type: geometryData.type,
                coordinates: geometryData.coordinates,
            },
            has_species: false,
            has_sample_trees: extraData.hasSampleTrees,
            sample_trees: sample_trees,
            is_complete: true,
            site_id: asText(data.plantProjectSite),
            intervention_type: extraData.key,
            form_data: [],
            additional_data: [],
            is_planned: data.isPlanning === true,
            meta_data: metaData,
            status: 'SYNCED',
            hid: asText(data.hid),
            coords: {
                type: 'Point',
                coordinates: geometryData.geoSpatial
            },
            entire_site: getEntireSiteCheck(data.metadata),
            last_screen: "PREVIEW",
            planted_species: plantedSpecies,
            form_id: interventionId,
            image: "",
            image_data: [],
            location_id: interventionId,
            locate_tree: "",
            remeasurement_required: extraData.key === 'single-tree-registration' ? false : remeasurement_required,
            next_measurement_date: extraData.key === 'single-tree-registration' ? 0 : rData.d,
            intervention_end_date: asDate(data.interventionEndDate, data.registrationDate) || interventionDate,
            // A record pulled from the server is already uploaded, so this flag
            // never holds back a sync (every sync queue skips SYNCED records).
            // It is here to mark the record in the list and carry the reason.
            fix_required: issues.length > 0 ? 'INCOMPLETE_DATA' : 'NO',
            // One reason per line. Joining them into a paragraph meant the
            // banner had to split prose back apart, and it cut sentences that
            // carry a full stop of their own in half.
            fix_reason: issues.join('\n'),
            last_updated_at: asDate(data.editedAt, data.updatedAt, Date.now()),
        }
        return finalData
    } catch (error) {
        console.error("Error in converting inventory to intervention: ", error);
        return null
    }
}
