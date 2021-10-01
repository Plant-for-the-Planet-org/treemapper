/* ============================================== *\
      Inventory registration statuses - STARTS
\* ============================================== */

// used as status to mark inventory as incomplete.
export const INCOMPLETE = 'INCOMPLETE';

// used as status to mark that sample trees are incomplete. Only used in multiple tree for on-site location.
export const INCOMPLETE_SAMPLE_TREE = 'INCOMPLETE_SAMPLE_TREE';

// used as status when data upload is pending.
export const PENDING_DATA_UPLOAD = 'PENDING_DATA_UPLOAD';

// used as status when data upload is started.
export const DATA_UPLOAD_START = 'DATA_UPLOAD_START';

// used as status when image upload of inventory is pending.
export const PENDING_IMAGE_UPLOAD = 'PENDING_IMAGE_UPLOAD';

// used as status when image upload of inventory is pending.
export const PENDING_SAMPLE_TREES_UPLOAD = 'PENDING_SAMPLE_TREES_UPLOAD';

// used as status to mark that the inventory is synced
export const SYNCED = 'SYNCED';

// used as status to mark that the inventory is synced
export const PENDING_DATA_UPDATE = 'PENDING_DATA_UPDATE';

/* === Inventory registration statuses - ENDS === */

/* ============================================== *\
      Inventory registration count - STARTS
\* ============================================== */

// used as status to mark inventory as incomplete.
export const TOTAL_COUNT = 'TOTAL_COUNT';
export const PENDING_UPLOAD_COUNT = 'PENDING_UPLOAD_COUNT';
export const INCOMPLETE_COUNT = 'INCOMPLETE_COUNT';

export const getPendingStatus = () => [
      PENDING_DATA_UPLOAD,
      PENDING_IMAGE_UPLOAD,
      PENDING_SAMPLE_TREES_UPLOAD,
      DATA_UPLOAD_START,
      PENDING_DATA_UPDATE
];
export const getIncompleteStatus = () => [INCOMPLETE, INCOMPLETE_SAMPLE_TREE];
export const getCompletedStatus = () => [SYNCED];

/* === Inventory registration count - ENDS === */

/* ========================================================= *\
      Inventory trees location while registering - STARTS
\* ========================================================= */

// used when the trees are planted on site
export const ON_SITE = 'on-site';

// used when the trees are planted off site
export const OFF_SITE = 'off-site';

// used when the trees are being reviewed
export const REVIEW = 'review';

/* === Inventory trees location while registering - ENDS === */

/* ====================================== *\
      Registered tree(s) type - STARTS
\* ====================================== */

// used when inventory has multiple trees i.e. multiple trees registration
export const MULTI = 'multi';

// used when inventory has only one tree i.e. single tree registration
export const SINGLE = 'single';

// used when multiple tree registration is on-site inventory
export const SAMPLE = 'sample';

/* === Registered tree(s) type - ENDS === */

/* ====================================== *\
      Marked coordinates type - STARTS
\* ====================================== */

// used when inventory has multiple coordinates. Used in multiple trees registration.
export const POLYGON = 'Polygon';

// used when inventory has single coordinate. Used in multiple and single tree registration.
export const POINT = 'Point';

/* === Marked coordinates type - ENDS === */

export const INCREMENT = 'increment';

export const DECREMENT = 'decrement';

export type geoJSONType = {
      type: string;
      features: {
            type: string;
            properties?: {
                  isPolygonComplete: boolean;
            };
            geometry: {
                  type: string;
                  coordinates: any[];
            };
      }[];
};