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
import PlantProjectBackdrop from 'assets/images/svg/PlantProjectIcon.svg'
import { Colors, Typography } from 'src/utils/constants'

import openWebView from 'src/utils/helpers/appHelper/openWebView'
import LargeButton from 'src/components/common/LargeButton'
import { useQuery } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { handleFilter } from 'src/utils/constants/CountryDataFilter'

interface ProjectListProps {
  isSelectable?: boolean;
  onProjectPress?: (id: string) => void;
  selectedProjectId?: string;
}

// Mark the props as read-only
type ReadonlyProjectListProps = Readonly<ProjectListProps>;

export default function ProjectList(props: ReadonlyProjectListProps) {
  const {
    isSelectable,
    onProjectPress,
    selectedProjectId,
  } = props
  const allProjects = useQuery(RealmSchema.Projects, data => {
    return data
  })
  const renderFooter = () => {
    return (
      <LargeButton
        onPress={() =>
          openWebView(
            `${process.env.EXPO_PUBLIC_API_PROTOCOL}://${process.env.EXPO_PUBLIC_WEBAPP_URL}/manage-projects/add-project`,
          )
        }
        style={{ marginTop: 20 }}
        heading={i18next.t('label.add_new_project')}
        subHeading={i18next.t('label.add_new_project_desc')}
        testID={'add_new_project_button'}
        accessibilityLabel={'add_new_project_button'}
      />
    )
  }
  return (
    <FlatList
      data={allProjects}
      ListFooterComponent={renderFooter}
      renderItem={({ item }) => {
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
  if (item.purpose !== 'trees' && item.purpose !== 'conservation') {
    return null
  }
  return (
    <View
      style={[
        styles.listItemContainer,
        isProjectSelected ? { borderColor: Colors.PRIMARY } : {},
      ]}>
      {item.image && process.env.EXPO_PUBLIC_CDN_URL ? (
        <Image
          source={{
            uri: `${process.env.EXPO_PUBLIC_API_PROTOCOL}://${process.env.EXPO_PUBLIC_CDN_URL}/media/cache/project/medium/${item.image}`,
          }}
          style={styles.image}
        />
      ) : (
        <View style={[styles.image, { paddingBottom: 10 }]}>
          <PlantProjectBackdrop />
        </View>
      )}
      <Text
        style={[
          styles.projectText,
          isProjectSelected ? { color: Colors.PRIMARY } : {},
        ]}>
        {item.name}
      </Text>
      {(country || item.country) && (
        <Text
          style={[
            styles.projectText,
            { fontFamily: Typography.FONT_FAMILY_REGULAR },
          ]}>
          {country || item.country}
        </Text>
      )}
      <View style={[styles.chipWrapper, { borderColor: item.purpose === 'trees' ? Colors.NEW_PRIMARY : Colors.LIGHT_AMBER }]}>
        <Text style={[styles.chipLabel, { color: item.purpose === 'trees' ? Colors.NEW_PRIMARY : Colors.LIGHT_AMBER }]}>{item.purpose.toUpperCase()}</Text>
      </View>
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
    paddingHorizontal: 10
  },
  chipWrapper: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    position: 'absolute',
    borderWidth: 1,
    borderColor: Colors.TEXT_COLOR,
    bottom: 15,
    right: 15,
    borderRadius: 20
  },
  chipLabel: {
    color: Colors.NEW_PRIMARY,
    fontSize: 12,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    letterSpacing: 0.5
  }
})
