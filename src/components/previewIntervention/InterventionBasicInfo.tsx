import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { timestampToBasicDate } from 'src/utils/helpers/appHelper/dataAndTimeHelper'
import { scaleSize } from 'src/utils/constants/mixins'

interface Props {
  title: string
  intervention_date: number
  project_name: string
  site_name: string
}

const InterventionBasicInfo = (props: Props) => {
  const { title, intervention_date, project_name, site_name } = props
  const dateFormated = () => {
    if (intervention_date) {
      return timestampToBasicDate(intervention_date)
    } else {
      return 0
    }
  }
  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <View style={styles.cardWrapper}>
          <Text style={styles.cardTitle}>Intervention Date</Text>
          <Text style={styles.cardLabel}>
            {dateFormated()}
          </Text>
        </View>
        <View style={styles.cardWrapper}>
          <Text style={styles.cardTitle}>Type</Text>
          <Text style={styles.cardLabel}>{title}</Text>
        </View>
        {project_name && (
          <View style={styles.cardWrapper}>
            <Text style={styles.cardTitle}>Project</Text>
            <Text style={styles.cardLabel}>{project_name}</Text>
          </View>
        )}
        {site_name && (
          <View style={styles.cardWrapper}>
            <Text style={styles.cardTitle}>Site</Text>
            <Text style={styles.cardLabel}>{site_name}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default InterventionBasicInfo

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    width: '90%',
    borderRadius: 10,
    backgroundColor: Colors.GRAY_BACKDROP + '1A',
    paddingVertical: 20,
    borderWidth: 0.5,
    borderColor: Colors.GRAY_TEXT,
    elevation: 5, // This adds a shadow on Android
    shadowColor: Colors.GRAY_TEXT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardWrapper: {
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  cardTitle: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleSize(14),
    marginBottom: 5,
    color: Colors.TEXT_LIGHT,
  },
  cardLabel: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleSize(14),
    color: Colors.TEXT_COLOR,
  },
})
