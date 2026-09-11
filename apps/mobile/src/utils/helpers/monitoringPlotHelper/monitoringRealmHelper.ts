import { MonitoringPlot } from "src/types/interface/slice.interface"
import { PLOT_COMPLEXITY, PLOT_SHAPE, PLOT_TYPE } from "src/types/type/app.type";

export function generateUniquePlotId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';

    // Loop to generate an 8-character string
    for (let i = 0; i < 8; i++) {
        // Non-secure randomness is acceptable here since this is just a simulated delay
        const randomIndex = Math.floor(Math.random() * chars.length);
        id += chars[randomIndex];
    }

    return id;
}


/**
 * A plain copy of a live plot, safe to read across awaits and to serialise.
 *
 * Do not use JSON.parse(JSON.stringify(plot)) on a plot. Realm's toJSON keeps
 * object identity: when it meets an object it has already converted it returns
 * that same JS object rather than a fresh copy (realm/dist/Object.js, toJSON).
 * A plot in a group links to the group through the `plot_group` backlink, and
 * the group lists the plot again in `plots`, so the converted graph contains a
 * real cycle and JSON.stringify throws. Every sync handler started with that
 * call, so a grouped plot could not sync photos, new plants, observations or
 * remeasurements, and the throw landed in a catch that printed nothing.
 *
 * Dropping `plot_group` breaks the only cycle: nothing else under a plot links
 * back to it. Callers that need the group read it off the live object first.
 */
export const snapshotPlot = <T = MonitoringPlot>(plot: unknown): T =>
    JSON.parse(JSON.stringify(plot, (key, value) => (key === 'plot_group' ? undefined : value)))


export const newPlotDetails = (shape: PLOT_SHAPE, type: PLOT_TYPE, complexity: PLOT_COMPLEXITY, project: { id: string; name: string }) => {
    const details: MonitoringPlot = {
        plot_id: generateUniquePlotId(),
        complexity: complexity,
        shape: shape,
        type: type,
        radius: 0,
        length: 0,
        width: 0,
        name: "",
        project_id: project.id,
        project_name: project.name,
        location: {
            type: "",
            coordinates: ""
        },
        coords: {
            type: "Point",
            coordinates: []
        },
        is_complete: false,
        additional_data: "",
        meta_data: "",
        status: "NOT_SYNCED",
        // A fresh plot has nothing wrong with it; only a permanently failed
        // upload sets this to anything else.
        fix_required: "NO",
        fix_reason: "",
        hid: "",
        lastScreen: "form",
        plot_plants: [],
        plot_created_at: Date.now(),
        plot_updated_at: Date.now(),
        local_image: "",
        cdn_image: "",
        plot_group: null,
        observations: []
    }
    return details
}