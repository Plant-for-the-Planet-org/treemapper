import bbox from '@turf/bbox';
import turfCenter from '@turf/center';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Colors, Typography } from '../../styles';

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
}: Props) => {
  const [projectOptions, setProjectOptions] = React.useState([]);

  // used to set the selected project
  const [selectedProjectId, setSelectedProjectId] = React.useState(null);
  // used to set the selected project site
  const [selectedProjectSiteId, setSelectedProjectSiteId] = React.useState(null);

  useEffect(() => {
    const options = projects.map(project => ({
      label: project.name,
      value: project.id,
      sites: project.sites,
    }));

    if (options.length > 0) {
      setSelectedProjectId(options[0].value);
      setProjectSitesUsingProject(options[0]);
    }
    setProjectOptions(options);
  }, [projects]);

  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find(project => project.id === selectedProjectId);
      const sites = project.sites.map(site => ({
        label: site.name,
        value: site.id,
        geometry: JSON.parse(site.geometry),
      }));

      setSelectedProjectStates(sites, project);
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
    <View style={{ display: 'flex', flex: 1, maxWidth: '50%', zIndex: 2 }}>
      <DropDownPicker
        items={projectOptions}
        open={showProjectOptions}
        setOpen={setShowProjectOptions}
        value={selectedProjectId}
        setValue={setSelectedProjectId}
        style={styles.dropDown}
        textStyle={styles.textStyle}
        selectedItemContainerStyle={{ backgroundColor: Colors.GRAY_LIGHT }}
        listItemContainerStyle={styles.listItemContainer}
        listItemLabelStyle={styles.listItemLabel}
        dropDownContainerStyle={styles.dropDownContainerStyle}
        zIndex={3000}
        zIndexInverse={1000}
        showTickIcon={false}
        itemSeparatorStyle={styles.itemSeparator}
        itemSeparator
      />
      {projectSites && projectSites.length > 0 && (
        <DropDownPicker
          items={projectSites}
          open={showProjectSiteOptions}
          setOpen={setShowProjectSiteOptions}
          value={selectedProjectSiteId}
          setValue={setSelectedProjectSiteId}
          style={styles.dropDown}
          textStyle={styles.textStyle}
          selectedItemContainerStyle={{ backgroundColor: Colors.GRAY_LIGHT }}
          listItemContainerStyle={styles.listItemContainer}
          listItemLabelStyle={styles.listItemLabel}
          dropDownContainerStyle={styles.dropDownContainerStyle}
          zIndex={2000}
          zIndexInverse={2000}
          showTickIcon={false}
          itemSeparatorStyle={styles.itemSeparator}
          itemSeparator
        />
      )}
    </View>
  );
};

export default ProjectAndSiteSelector;

const styles = StyleSheet.create({
  dropDown: {
    height: 44,
    borderWidth: 0,
    marginBottom: 8,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textStyle: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    color: Colors.PLANET_BLACK,
  },
  containerStyle: {
    zIndex: 10000,
  },
  dropDownContainerStyle: {
    borderWidth: 0,
  },
  listItemContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flex: 1,
    overflow: 'visible',
    height: 'auto',
  },
  listItemLabel: {
    flex: 1,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  itemSeparator: {
    backgroundColor: Colors.GRAY_LIGHT,
    height: 1,
    marginHorizontal: 8,
  },
});
