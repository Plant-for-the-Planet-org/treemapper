import i18next from 'i18next';
import React, {useEffect, useState} from 'react';
import {FlatList, Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {APIConfig} from '../../actions/Config';
import {plant_project} from '../../assets';
import {getAllProjects} from '../../repositories/projects';
import {Colors, Typography} from '../../styles';
import {handleFilter} from '../../utils/CountryDataFilter';
import openWebView from '../../utils/openWebView';
import {LargeButton} from '../Common';
const {protocol, cdnUrl, webAppUrl} = APIConfig;

interface ProjectListProps {
  isSelectable?: boolean;
  onProjectPress?: any;
  selectedProjectId?: string;
}

export default function ProjectList({
  isSelectable,
  onProjectPress,
  selectedProjectId,
}: ProjectListProps) {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    getAllProjects().then((projectsData: any) => (projectsData ? setProjects(projectsData) : {}));
  }, []);

  return (
    <FlatList
      data={projects}
      ListHeaderComponent={() => {
        if (isSelectable) {
          return (
            <LargeButton
              heading={i18next.t('label.continue_without_project')}
              subHeading={i18next.t('label.continue_without_project_desc')}
              onPress={() => onProjectPress(null)}
              active={!selectedProjectId}
            />
          );
        }
        return <></>;
      }}
      ListFooterComponent={() => {
        return (
          <LargeButton
            onPress={() => openWebView(`${protocol}://${webAppUrl}/profile/projects/new-project`)}
            style={{marginTop: 20}}
            heading={i18next.t('label.add_new_project')}
            subHeading={i18next.t('label.add_new_project_desc')}
            testID={'add_new_project_button'}
            accessibilityLabel={'add_new_project_button'}
          />
        );
      }}
      renderItem={({item}: {item: any}) => {
        if (isSelectable) {
          return (
            <TouchableProjectItem
              item={item}
              onProjectPress={() => {
                onProjectPress(item.id);
              }}
              selectedProjectId={selectedProjectId}
            />
          );
        }
        return <ProjectItem item={item} />;
      }}
      keyExtractor={(item: any) => item.id}
    />
  );
}

const ProjectItem = ({item, selectedProjectId}: {item: any; selectedProjectId?: string}) => {
  const isProjectSelected = selectedProjectId === item.id;
  let country: any = handleFilter(item.country);
  if (country && country.length > 0) {
    country = country[0].countryName;
  }
  return (
    <View
      style={[styles.listItemContainer, isProjectSelected ? {borderColor: Colors.PRIMARY} : {}]}>
      {item.image && cdnUrl ? (
        <Image
          source={{uri: `${protocol}://${cdnUrl}/media/cache/project/medium/${item.image}`}}
          style={styles.image}
        />
      ) : (
        <View style={[styles.image, {paddingBottom: 10}]}>
          <SvgXml width="100%" height="100%" xml={plant_project} />
        </View>
      )}
      <Text style={[styles.projectText, isProjectSelected ? {color: Colors.PRIMARY} : {}]}>
        {item.name}
      </Text>
      {(country || item.country) && (
        <Text style={[styles.projectText, {fontFamily: Typography.FONT_FAMILY_REGULAR}]}>
          {country ? country : item.country}
        </Text>
      )}
    </View>
  );
};

const TouchableProjectItem = ({
  item,
  onProjectPress,
  selectedProjectId,
}: {
  item: any;
  onProjectPress: any;
  selectedProjectId?: string;
}) => {
  return (
    <TouchableOpacity onPress={onProjectPress}>
      <ProjectItem item={item} selectedProjectId={selectedProjectId} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  listItemContainer: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.LIGHT_BORDER_COLOR,
    marginTop: 20,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginBottom: 10,
  },
  projectText: {
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_16,
    marginTop: 4,
  },
});
