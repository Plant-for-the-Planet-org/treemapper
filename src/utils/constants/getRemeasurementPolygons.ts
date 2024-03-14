import moment from 'moment';

const getRemeasurementPolygons = async (allInventory: any) => {
  const remeasurementNeededPolygons = [];
  const remeasurementDuePolygons = [];

  for (const singleInventory of allInventory) {
    if (Array.isArray(singleInventory.sampleTrees)) {
      for (const sampleTree of singleInventory.sampleTrees) {
        if (sampleTree.remeasurementDates?.nextMeasurement) {
          const nextMeasurement = moment(sampleTree.remeasurementDates?.nextMeasurement);
          const remeasurementDeadline = moment(new Date()).add(3, 'months');
          const today = moment(new Date());

          if (moment(nextMeasurement).isBetween(today, remeasurementDeadline)) {
            remeasurementNeededPolygons.push(singleInventory.inventory_id);
          }

          if (moment(nextMeasurement).isBefore(today)) {
            remeasurementDuePolygons.push(singleInventory.inventory_id);
          }
        }
      }
    }
  }

  return {remeasurementNeededPolygons, remeasurementDuePolygons};
};

export {getRemeasurementPolygons};
