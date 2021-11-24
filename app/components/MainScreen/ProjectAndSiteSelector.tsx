import i18next from 'i18next';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';
import { Colors, Typography } from '../../styles';
import turfCenter from '@turf/center';
import bbox from '@turf/bbox';

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
  const [selectedProject, setSelectedProject] = React.useState(null);
  // used to set the selected project site
  const [selectedProjectSite, setSelectedProjectSite] = React.useState(null);

  useEffect(() => {
    const options = projects.map(project => ({
      key: project.id,
      value: project.name,
      sites: project?.sites,
    }));
    if (options.length > 0) {
      setSelectedProject(options[0]);
      if (options[0].sites.length > 0) {
        const sites = options[0].sites.map(site => ({
          key: site.id,
          value: site.name,
          geometry: JSON.parse(site.geometry),
        }));
        setSelectedProjectStates(sites);
      }
    }
    setProjectOptions(options);
  }, [projects]);

  useEffect(() => {
    if (selectedProject && selectedProject.sites && selectedProject.sites.length > 0) {
      const sites = selectedProject.sites.map(site => ({
        key: site.id,
        value: site.name,
        geometry: JSON.parse(site.geometry),
      }));

      setSelectedProjectStates(sites);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProjectSite?.geometry) {
      // setSiteCenterCoordinate(turfCenter(selectedProjectSite.geometry));

      setSiteBounds(bbox(selectedProjectSite.geometry));
    }
  }, [selectedProjectSite]);

  const setSelectedProjectStates = (sites: any) => {
    setProjectSites(sites);
    setSelectedProjectSite(sites[0]);
    // setSiteCenterCoordinate(turfCenter(sites[0].geometry));

    setSiteBounds(bbox(sites[0].geometry));
  };

  return (
    <View style={{ display: 'flex', flex: 1 }}>
      <Dropdown
        options={projectOptions}
        onChange={(project: any) => {
          setSelectedProject(project);
          setProjectSites(project.sites);
        }}
        defaultValue={selectedProject}
        label={i18next.t('label.select_project')}
        showOptions={showProjectOptions}
        setShowOptions={setShowProjectOptions}
        containerStyle={{ marginBottom: 8, minHeight: 44, zIndex: 20001 }}
      />
      {projectSites && projectSites.length > 0 && (
        <Dropdown
          options={projectSites}
          onChange={(site: any) => {
            setSelectedProjectSite(site);
          }}
          defaultValue={selectedProjectSite}
          label={i18next.t('label.select_project_site')}
          showOptions={showProjectSiteOptions}
          setShowOptions={setShowProjectSiteOptions}
          containerStyle={{ minHeight: 44 }}
        />
      )}
    </View>
  );
};

export default ProjectAndSiteSelector;

const Dropdown = ({
  options,
  onChange,
  defaultValue,
  containerStyle,
  label,
  showOptions,
  setShowOptions,
}: {
  options: any[];
  onChange: (project: any) => void;
  defaultValue: any;
  containerStyle?: any;
  label: string;
  showOptions: boolean;
  setShowOptions: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [selectedValue, setSelectedValue] = React.useState(defaultValue);

  React.useEffect(() => {
    setSelectedValue(defaultValue);
  }, [defaultValue]);

  const onSelect = (option: any) => {
    setSelectedValue(option);
    onChange(option);
    setShowOptions(false);
  };

  const onToggleOptions = () => {
    setShowOptions(!showOptions);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity style={styles.dropdownContainer} onPress={() => onToggleOptions()}>
        <Text style={styles.dropdownText} numberOfLines={1} ellipsizeMode={'tail'}>
          {selectedValue ? selectedValue.value : label}
        </Text>
        <Icon
          name={showOptions ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#8E8E93"
          style={{ paddingLeft: 4 }}
        />
      </TouchableOpacity>
      {showOptions && (
        <View style={styles.optionParent}>
          <ScrollView style={styles.optionsContainer} contentContainerStyle={{ maxHeight: 400 }}>
            {options.map(option => (
              <TouchableOpacity
                key={option.key}
                style={[styles.option, selectedValue === option ? styles.selectedOption : {}]}
                onPress={() => onSelect(option)}>
                <Text style={styles.optionText}>{option.value}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.GRAY_LIGHT,
    zIndex: 20000,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  dropdownText: {
    fontSize: 12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.PLANET_BLACK,
    flex: 1,
  },
  optionParent: {
    backgroundColor: Colors.WHITE,
    borderRadius: 14,
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    overflow: 'hidden',
    elevation: 20,
  },
  optionsContainer: {
    borderRadius: 14,
    maxHeight: 400,
  },
  option: {
    backgroundColor: Colors.WHITE,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  selectedOption: {
    backgroundColor: Colors.GRAY_LIGHT,
  },
  optionText: {
    fontSize: 12,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.PLANET_BLACK,
  },
});
