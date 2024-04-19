import {FlatList, StyleSheet, Text, View} from 'react-native'
import React from 'react'
import OfflineMapCards from './OfflineMapCards'
import {scaleFont} from 'src/utils/constants/mixins'
import {Colors, Typography} from 'src/utils/constants'

const OfflineMapList = () => {
  return (
    <View style={styles.container}>
      <FlatList
        data={[1,2,3]}
        renderItem={() => <OfflineMapCards />}
        ListHeaderComponent={() => (
          <Text style={styles.header}>Saved Offline Areas</Text>
        )}
      />
    </View>
  )
}

export default OfflineMapList

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginLeft: 20,
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.TEXT_LIGHT,
    marginTop: 20,
  },
})
