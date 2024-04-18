import i18next from 'src/locales/index'
import React from 'react'
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import PlantProjectBackfrop from 'assets/images/svg/PlantProjectIcon.svg'
import {Colors, Typography} from 'src/utils/constants'
import {handleFilter} from 'src/utils/constants/countryDataFilter'
import openWebView from 'src/utils/helpers/appHelper/openWebView'
import LargeButton from 'src/components/common/LargeButton'
import {useQuery} from '@realm/react'
import {RealmSchema} from 'src/types/enum/db.enum'

interface ProjectListProps {
  isSelectable?: boolean
  onProjectPress?: any
  selectedProjectId?: string
}

export default function ProjectList({
  isSelectable,
  onProjectPress,
  selectedProjectId,
}: ProjectListProps) {
  const allProjects = useQuery(RealmSchema.Projects, data => {
    return data
  })

  return (
    <FlatList
      data={allProjects}
      ListHeaderComponent={() => {
        if (isSelectable) {
          return (
            <LargeButton
              heading={i18next.t('label.continue_without_project')}
              subHeading={i18next.t('label.continue_without_project_desc')}
              onPress={() => onProjectPress(null)}
              active={!selectedProjectId}
            />
          )
        }
        return <></>
      }}
      ListFooterComponent={() => {
        return (
          <LargeButton
            onPress={() =>
              openWebView(
                `${process.env.EXPO_PUBLIC_API_PROTOCOL}://${process.env.EXPO_PUBLIC_WEBAPP_URL}/manage-projects/add-project`,
              )
            }
            style={{marginTop: 20}}
            heading={i18next.t('label.add_new_project')}
            subHeading={i18next.t('label.add_new_project_desc')}
            testID={'add_new_project_button'}
            accessibilityLabel={'add_new_project_button'}
          />
        )
      }}
      renderItem={({item}: {item: any}) => {
        if (isSelectable) {
          return (
            <TouchableProjectItem
              item={item}
              onProjectPress={() => onProjectPress(item.id)}
              selectedProjectId={selectedProjectId}
            />
          )
        }
        return <ProjectItem item={item} />
      }}
      keyExtractor={(item: any) => item.id}
      style={styles.container}
    />
  )
}

const ProjectItem = ({
  item,
  selectedProjectId,
}: {
  item: any
  selectedProjectId?: string
}) => {
  const isProjectSelected = selectedProjectId === item.id
  let country: any = handleFilter(item.country)
  if (country) {
    country = country[0].countryName
  }
  return (
    <View
      style={[
        styles.listItemContainer,
        isProjectSelected ? {borderColor: Colors.PRIMARY} : {},
      ]}>
      {item.image && process.env.EXPO_PUBLIC_CDN_URL ? (
        <Image
          source={{
            uri: `${process.env.EXPO_PUBLIC_API_PROTOCOL}://${process.env.EXPO_PUBLIC_CDN_URL}/media/cache/project/medium/${item.image}`,
          }}
          style={styles.image}
        />
      ) : (
        <View style={[styles.image, {paddingBottom: 10}]}>
          <PlantProjectBackfrop />
        </View>
      )}
      <Text
        style={[
          styles.projectText,
          isProjectSelected ? {color: Colors.PRIMARY} : {},
        ]}>
        {item.name}
      </Text>
      {(country || item.country) && (
        <Text
          style={[
            styles.projectText,
            {fontFamily: Typography.FONT_FAMILY_REGULAR},
          ]}>
          {country ? country : item.country}
        </Text>
      )}
    </View>
  )
}

const TouchableProjectItem = ({
  item,
  onProjectPress,
  selectedProjectId,
}: {
  item: any
  onProjectPress: any
  selectedProjectId?: string
}) => {
  return (
    <TouchableOpacity onPress={onProjectPress}>
      <ProjectItem item={item} selectedProjectId={selectedProjectId} />
    </TouchableOpacity>
  )
}

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
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    paddingHorizontal:10
  },
})
