import bbox from '@turf/bbox';
import turfCenter from '@turf/center';
import React, {useContext, useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {setProject, setProjectSite} from '../../actions/projects';
import {ProjectContext} from '../../reducers/project';
import {Colors, Typography} from '../../styles';
import CustomDropDownPicker from '../Common/Dropdown/CustomDropDownPicker';

interface Props {
  projects: any[];
  showProjectOptions: boolean;
  setShowProjectOptions: React.Dispatch<React.SetStateAction<boolean>>;
  showProjectSiteOptions: boolean;
  setShowProjectSiteOptions: React.Dispatch<React.SetStateAction<boolean>>;
  setSiteCenterCoordinate: React.Dispatch<React.SetStateAction<any>>;
  setSiteBounds: React.Dispatch<React.SetStateAction<any>>;
  projectSites: any;
  setProjectSites: React.Dispatch<React.SetStateAction<any>>;
  IS_ANDROID: boolean;
}

const ProjectAndSiteSelector = ({
  projects,
  showProjectOptions,
  setShowProjectOptions,
  showProjectSiteOptions,
  setShowProjectSiteOptions,
  setSiteCenterCoordinate,
  setSiteBounds,
  projectSites,
  setProjectSites,
  IS_ANDROID,
}: Props) => {
  const [projectOptions, setProjectOptions] = React.useState([]);
  const {dispatch: projectDispatch, state: projectState} = useContext(ProjectContext);

  // used to set the selected project
  const [selectedProjectId, setSelectedProjectId] = React.useState(null);
  // used to set the selected project site
  const [selectedProjectSiteId, setSelectedProjectSiteId] = React.useState(null);

  useEffect(() => {
    const options = projects.map(project => ({
      label: project.name,
      value: project.id,
      sites: project.sites,
      geometry: project.geometry,
    }));
    if (projectState?.selectedProject && projectState?.selectedProject?.id) {
      setSelectedProjectId(projectState.selectedProject.id);
      setProjectSitesUsingProject(projectState.selectedProject);
      if (projectState.selectedProjectSite) {
        setSelectedProjectSiteId(projectState.selectedProjectSite);
      }
    } else if (options.length > 0) {
      setSelectedProjectId(options[0].value);
      setProjectSitesUsingProject(options[0]);
      setProject(projects[0])(projectDispatch);
    }
    setProjectOptions(options);
  }, [projects]);

  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find(project => project.id === selectedProjectId);
      if (project) {
        setProject(project)(projectDispatch);
        const sites = project.sites.map(site => ({
          label: site.name,
          value: site.id,
          geometry: JSON.parse(site.geometry),
        }));

        setSelectedProjectStates(sites, project);
      }
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProjectSiteId) {
      const site = projectSites.find(site => site.value === selectedProjectSiteId);
      if (site) {
        setSiteCenterCoordinate([]);
        setSiteBounds(bbox(site.geometry));
      }
    }
  }, [selectedProjectSiteId]);

  const setSelectedProjectStates = (sites: any, project: any) => {
    setProjectSites(sites);
    if (sites && sites.length > 0) {
      setSelectedProjectSiteId(sites[0].value);
      setProjectSite(sites[0].value);
      setSiteCenterCoordinate([]);
      setSiteBounds(bbox(sites[0].geometry));
    } else {
      setSelectedProjectSiteId(null);
      setSiteBounds([]);
      setSiteCenterCoordinate(turfCenter(JSON.parse(project.geometry)).geometry.coordinates);
    }
  };

  const setProjectSitesUsingProject = (project: any) => {
    if (project) {
      const sites = project.sites.map(site => ({
        label: site.name,
        value: site.id,
        geometry: JSON.parse(site.geometry),
      }));
      setSelectedProjectStates(sites, project);
    }
  };

  return (
    <View style={[{display: 'flex', flex: 1, maxWidth: '50%'}, !IS_ANDROID ? {zIndex: 2} : {}]}>
      <CustomDropDownPicker
        items={projectOptions}
        open={showProjectOptions}
        setOpen={setShowProjectOptions}
        value={selectedProjectId}
        setValue={setSelectedProjectId}
        style={{marginBottom: 8}}
        zIndex={6000}
        zIndexInverse={1000}
        // setProject={setProject}
      />
      {projectSites && projectSites.length > 0 && (
        <CustomDropDownPicker
          items={projectSites}
          open={showProjectSiteOptions}
          setOpen={setShowProjectSiteOptions}
          value={selectedProjectSiteId}
          setValue={setSelectedProjectSiteId}
          // setProjectSite={setProjectSite}
        />
      )}
    </View>
  );
};

export default ProjectAndSiteSelector;
