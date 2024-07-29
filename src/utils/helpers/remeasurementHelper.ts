import moment from "moment";
import { InterventionData, SampleTree } from "src/types/interface/slice.interface"

export const updateRemeasurementStatus = (intervention: InterventionData) => {
    const projectRemeasureDateAfter = 2
    const date = moment(intervention.intervention_date);
    const twoYearsAgo = moment().subtract(projectRemeasureDateAfter, 'years');
    const locationNeedRemeasurement = date.isSameOrBefore(twoYearsAgo);
    if (locationNeedRemeasurement) {
        let sampleTreeRequireRemeasurement = false;
        if (intervention.sample_trees.length > 0) {
            intervention.sample_trees.forEach(tree => {
                if (tree.remeasurement_dates.lastMeasurement) {
                    const date = moment(tree.remeasurement_dates.lastMeasurement);
                    const twoYearsAgo = moment().subtract(projectRemeasureDateAfter, 'years');
                    sampleTreeRequireRemeasurement = date.isSameOrBefore(twoYearsAgo);
                } else {
                    const date = moment(tree.remeasurement_dates.created);
                    const twoYearsAgo = moment().subtract(projectRemeasureDateAfter, 'years');
                    sampleTreeRequireRemeasurement = date.isSameOrBefore(twoYearsAgo);
                }
            })
        }
        return sampleTreeRequireRemeasurement
    } else {
        return false
    }
}

export const isAllRemeasurementDone = (treeDetails: SampleTree[]) => {
    return treeDetails.some(tree => tree.remeasurement_requires);
};