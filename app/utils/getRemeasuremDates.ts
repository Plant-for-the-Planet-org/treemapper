import {getRemeasurementDatesFromServer} from '../actions/remeasurement';
import {getAllProjects} from '../repositories/projects';

const getRemeasurementDates = () => {
  getAllProjects().then(projectsData => {
    const projects = JSON.stringify(projectsData);
    projectsData.forEach((project, index) => {
      getRemeasurementDatesFromServer(project.id, index);
    });
  });
};

export {getRemeasurementDates};
