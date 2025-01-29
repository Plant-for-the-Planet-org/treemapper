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


export const newPlotDetails = (shape: PLOT_SHAPE, type: PLOT_TYPE, complexity: PLOT_COMPLEXITY) => {
    const details: MonitoringPlot = {
        plot_id: generateUniquePlotId(),
        complexity: complexity,
        shape: shape,
        type: type,
        radius: 0,
        length: 0,
        width: 0,
        name: "",
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
        status: "INIT",
        hid: "",
        lastScreen: "form",
        plot_plants: [],
        plot_created_at: Date.now(),
        plot_updated_at: Date.now(),
        local_image: "",
        cdn_image: "",
        plot_group: null,
        observations: [],
        server_id: ""
    }
    return details
}