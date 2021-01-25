export default function distanceCalculator(lat1, lon1, lat2, lon2, unit) {
  if (lat1 == lat2 && lon1 == lon2) {
    return 0;
  } else {
    var radiusLatitude1 = (Math.PI * lat1) / 180;
    var radiusLatitude2 = (Math.PI * lat2) / 180;
    var theta = lon1 - lon2;
    var radiusTheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radiusLatitude1) * Math.sin(radiusLatitude2) +
      Math.cos(radiusLatitude1) * Math.cos(radiusLatitude2) * Math.cos(radiusTheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit == 'K') {
      dist = dist * 1.609344;
    }
    if (unit == 'N') {
      dist = dist * 0.8684;
    }
    return dist;
  }
}
