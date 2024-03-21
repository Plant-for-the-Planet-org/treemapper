import { Coordinates } from "./app.interface";

export interface AppInitialState{
    last_open: number;
}

export interface GpsSliceInitalState{
    user_location: Coordinates;
}