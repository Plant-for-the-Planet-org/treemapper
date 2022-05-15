import moment from 'moment';
import { getProjectById } from '../repositories/projects';

const getRemeasurementPolygons = (allInventory: any) => {
  const remeasurementNeededPolygons = [];
  const remeasurementDuePolygons = [];

  for (let singleInventory of allInventory) {
    let project = {};
    if (singleInventory.projectId) {
      project = getProjectById(singleInventory.projectId);
    }
    let sampleTreesToBeRemeasured = 0;
    if (Array.isArray(singleInventory.sampleTrees)) {
      for (let sampleTree of singleInventory.sampleTrees) {
        let startDate = moment(sampleTree.remeasurementDates.remeasureBy).subtract('days', 60);
        let endDate = moment(sampleTree.remeasurementDates.remeasureBy).add('days', 60);

        if (moment(new Date()).isBetween(startDate, endDate)) {
          sampleTreesToBeRemeasured++;
          if (sampleTreesToBeRemeasured == singleInventory.sampleTrees.length) {
            remeasurementNeededPolygons.push(singleInventory.inventory_id);
          }
        }
      }
    }
  }
  console.log(remeasurementNeededPolygons.length, 'remeasurementNeededPolygons Length');
  return remeasurementNeededPolygons;
};

export { getRemeasurementPolygons };
