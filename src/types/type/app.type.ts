export type AFTER_CAPTURE = 'SPECIES_INFO' | 'POINT_REGISTER' | 'POLYGON_REGISTER' | 'SAMPLE_TREE' | 'EDIT_INTERVENTION' | 'EDIT_SAMPLE_TREE' | 'PLOT_IMAGE'

export type INTERVENTION_TYPE = 'single-tree-registration' | 'multi-tree-registration' | 'removal-invasive-species' | 'fire-suppression' | 'fire-patrol' | 'fencing' | 'marking-regenerant' | 'liberating-regenerant' | 'grass-suppression' | 'firebreaks' | 'assisting-seed-rain' | 'soil-improvement' | 'stop-tree-harvesting' | 'direct-seeding' | 'enrichement-planting' | 'other-intervention' | 'maintenance'


export type FORM_TYPE = 'INPUT' | 'INFO' | 'SWITCH' | 'TAG_SWITCH' | 'TEXTAREA' | 'DROPDOWN' | 'YES_NO' | 'HEADING' | 'GAP' | 'PAGE'

export type DATA_VISIBLITY = 'public' | 'private' | 'app'

export type MAP_BOUNDS = "DISPLAY_MAP" | "POINT_MAP" | "POLYGON_MAP" | "PREVIEW_MAP" | "UNKNOWN"

export type SIDE_DRAWER_ELEMENTS = 'logout' | 'manage_species' | 'manage_projects' | 'additional_data' | 'offline_map' | 'data_explorer' | 'activity_log'


export type INTERVENTION_STATUS = 'SYNCED' | 'NOT_SYNCED'

export type INTERVENTION_FILTER = 'always' | 'year' | 'months' | 'days' | 'none'

export type LOG_TYPES = "INTERVENTION" | "MAPS" | "MANAGE_SPECIES" | "DATA_SYNC" | "USER" | "PROJECTS" | "OTHER" | "ADDITIONAL_DATA" | "LOCATION"

export type LOG_LEVELS = 'info' | 'warn' | 'error';


export type PLOT_TYPE = "INTERVENTION" | "CONTROL"
export type PLOT_SHAPE = "RECTANGULAR" | "CIRCULAR"
export type PLOT_COMPLEXITY = "STANDARD" | "SIMPLE"
export type PLOT_PLANT = "PLANTED" | "RECRUIT"
export type PLOT_PLANT_STATUS = "PLANTED" | "RECRUIT" | "REMEASURMENT" | "DESCEASED"
export type OBSERVATION_TYPE = "CANOPY" | "SOIL_MOISTURE" | "BIOACUSTICS"
export type MAP_VIEW = "SATELLITE" | "VECTOR"
export type TREE_RE_STATUS = "FLOOD" | "FIRE" | "DROUGHT" | "OTHER"

export type LAST_SCREEN = "FORM" | "LOCATION" | "SPECIES" | "TOTAL_TREES" | "TREE_DETAILS" | "LOCAL_FORM" | "DYNAMIC_FORM" | "PREVIEW"
