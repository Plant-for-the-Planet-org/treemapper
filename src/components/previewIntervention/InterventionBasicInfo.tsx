import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import {Colors} from 'src/utils/constants'
import {timestampToBasicDate} from 'src/utils/appHelper/dataAndTimeHelper'

interface Props {
  data: {
    title: string
    intervention_date: number
    project_name: string
    site_name: string
  }
}

const InterventionBasicInfo = (props: Props) => {
  const {title, intervention_date, project_name, site_name} = props.data
  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <View style={styles.cardWrapper}>
          <Text style={styles.cardTitle}>Intervention Date</Text>
          <Text style={styles.cardLabel}>
            {timestampToBasicDate(intervention_date)}
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
        {site_name && <View style={styles.cardWrapper}>
          <Text style={styles.cardTitle}>Site</Text>
          <Text style={styles.cardLabel}>{site_name}</Text>
        </View>}
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
    borderRadius: 20,
    backgroundColor: 'white',
    paddingVertical: 20,
    borderColor: Colors.GRAY_BACKDROP,
  },
  cardWrapper: {
    width: '100%',
    height: 55,
    paddingHorizontal: 20,
  },
  cardTitle: {
    fontSize: 16,
    color: 'lightgray',
  },
  cardLabel: {
    fontSize: 14,
    color: 'gray',
    fontWeight: '500',
  },
})
