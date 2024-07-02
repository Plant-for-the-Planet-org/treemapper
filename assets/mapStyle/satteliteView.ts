const SatteliteLayer = {
    "version": 8,
    "metadata": "PFTP",
    "name": "",
    "bearing": 0,
    "pitch": 0,
    "zoom": 9,
    "center": [-117.3, 32.6, 9],
    "sources": {
        "imagery": {
            "tilejson": "3.0.0",
            "version": "1.0.0",
            "name": "Imagery",
            "description": "",
            "attribution": "",
            "bounds": [-180, -85.051129, 180, 85.051129],
            "center": [-117.3, 32.6, 9],
            "minzoom": 0,
            "maxzoom": 24,
            "scheme": "xyz",
            "volatile": false,
            "type": "raster",
            "tileSize": 256,
            "tiles": [
                process.env.EXPO_PUBLIC_OFFLINE_LINK
            ]
        }
    },
    "id": "Imagery",
    "layers": [
        {
            "metadata": "",
            "id": "Imagery",
            "source": "imagery",
            "minzoom": 0,
            "maxzoom": 24,
            "type": "raster",
            "raster-opacity": 1,
            "layout": { "visibility": "visible" }
        }
    ]
}
export default SatteliteLayer