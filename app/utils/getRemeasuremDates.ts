import {getRemeasurementDatesFromServer} from '../actions/remeasurement';
import {getAllProjects} from '../repositories/projects';

const getRemeasurementDates = () => {
  getAllProjects().then(projectsData => {
    console.log('++++++++++');
    const projects = JSON.stringify(projectsData);
    projectsData.forEach((project, index) => {
      getRemeasurementDatesFromServer(project.id, index);
    });
    console.log(projectsData[0], 'projectsData==', Object.keys(projectsData[0]));
  });
};

export {getRemeasurementDates};
