import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import OfflineMapTile from 'assets/images/svg/MapTileIcon.svg'
import {Colors, Typography} from 'src/utils/constants'
import {scaleFont} from 'src/utils/constants/mixins'
import BinIcon from 'assets/images/svg/BinIcon.svg'

const OfflineMapCars = () => {
  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <OfflineMapTile height={50} width={50} />
        <View style={styles.sectionWrapper}>
          <Text style={styles.mapLabel}>Kota Rajastan India</Text>
          <Text style={styles.metaLabel}>123 mb</Text>
        </View>
        <View style={styles.binIconWrapper}>
          <BinIcon height={20} width={20} fill={'tomato'} />
        </View>
      </View>
    </View>
  )
}

export default OfflineMapCars

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    width: '90%',
    height: '80%',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.WHITE,
  },
  sectionWrapper: {
  },
  iconWrapper: {
    marginLeft: 10,
  },
  footer: {
    width: '100%',
    flex: 1,
    backgroundColor: 'green',
  },
  mapLabel: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.TEXT_LIGHT,
    fontSize: scaleFont(16),
  },
  metaLabel: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.TEXT_LIGHT,
    fontSize: scaleFont(12),
    marginTop: 5,
  },
  binIconWrapper: {
    width: 40,
    height: 40,
    backgroundColor: Colors.BACKDROP_RED + '1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
})
