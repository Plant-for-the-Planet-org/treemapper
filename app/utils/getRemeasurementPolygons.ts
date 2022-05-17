import moment from 'moment';
import { getProjectById } from '../repositories/projects';

const getRemeasurementPolygons = async (allInventory: any) => {
  const remeasurementNeededPolygons = [];
  const remeasurementDuePolygons = [];

  for (let singleInventory of allInventory) {
    let project = {};

    if (singleInventory.projectId) {
      project = await getProjectById(singleInventory.projectId);
    }
    let intensity = project?.intensity || 100;
    let frequency = project?.frequency || 'Default';

    let sampleTreesToBeRemeasured = 0;
    let sampleTreesDueRemeasured = 0;
    if (Array.isArray(singleInventory.sampleTrees)) {
      for (let sampleTree of singleInventory.sampleTrees) {
        let startDate = moment(sampleTree.remeasurementDates.remeasureBy).subtract(60, 'days');
        let endDate = moment(sampleTree.remeasurementDates.remeasureBy).subtract(45, 'days');

        if (moment(new Date()).isBetween(startDate, endDate)) {
          sampleTreesToBeRemeasured++;
          if (
            sampleTreesToBeRemeasured ==
            Math.ceil(singleInventory.sampleTrees.length * intensity) / 100
          ) {
            remeasurementNeededPolygons.push(singleInventory.inventory_id);
          }
        } else if (moment(new Date()) > endDate) {
          sampleTreesDueRemeasured++;
          if (
            sampleTreesDueRemeasured ==
            Math.ceil(singleInventory.sampleTrees.length * intensity) / 100
          ) {
            remeasurementDuePolygons.push(singleInventory.inventory_id);
          }
        }
      }
    }
  }
  console.log(
    remeasurementNeededPolygons.length,
    remeasurementDuePolygons.length,
    'remeasurementNeededPolygons Length',
  );
  return { remeasurementNeededPolygons, remeasurementDuePolygons };
};

export { getRemeasurementPolygons };
