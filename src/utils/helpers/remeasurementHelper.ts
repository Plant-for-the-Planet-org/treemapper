import moment from "moment";
import { InterventionData, SampleTree } from "src/types/interface/slice.interface"

export const updateRemeasurmentStatus = (intervention: InterventionData) => {
    const projectRemasurentDateAfter = 2
    const date = moment(intervention.intervention_date);
    const twoYearsAgo = moment().subtract(projectRemasurentDateAfter, 'years');
    const locationNeedRemeasurement = date.isSameOrBefore(twoYearsAgo);
    if (locationNeedRemeasurement) {
        let sampleTreeRequireRemeasuremnt = false;
        if (intervention.sample_trees.length > 0) {
            intervention.sample_trees.forEach(tree => {
                if (tree.remeasurement_dates.lastMeasurement) {
                    const date = moment(tree.remeasurement_dates.lastMeasurement);
                    const twoYearsAgo = moment().subtract(projectRemasurentDateAfter, 'years');
                    sampleTreeRequireRemeasuremnt = date.isSameOrBefore(twoYearsAgo);
                } else {
                    const date = moment(tree.remeasurement_dates.created);
                    const twoYearsAgo = moment().subtract(projectRemasurentDateAfter, 'years');
                    sampleTreeRequireRemeasuremnt = date.isSameOrBefore(twoYearsAgo);
                }
            })
        }
        return sampleTreeRequireRemeasuremnt
    } else {
        return false
    }
}

export const isAllRemeasurmentDone = (treeDetails: SampleTree[]) => {
    return treeDetails.some(tree => tree.remeasurement_requires);
};