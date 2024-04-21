import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import CtaArrow from 'assets/images/svg/CtaArrow.svg'
import {Colors, Typography} from 'src/utils/constants'
import {scaleSize} from 'src/utils/constants/mixins'
import CopyIcon from 'assets/images/svg/CopyIcon.svg'

interface Props {
  coordinates: Array<number[]>
  type: string
}

const CoordinatesList = (props: Props) => {
  const {coordinates, type} = props
  const renderCard = () => {
    const listCoord = type==='Polygon'?  coordinates[0] : coordinates
    return listCoord.map((el, i) => {
      return (
        <View style={styles.wrapper} key={i}>
          <View style={styles.card}>
            <View style={styles.metaWrapper}>
              <Text style={styles.coordinateTitle}>Coordinate</Text>
              <Text style={styles.coordinatesLabel}>
                {`${el[0].toFixed(6)}`},{`${el[1].toFixed(6)}`}
              </Text>
            </View>
            <View style={styles.divider} />
            <CtaArrow style={styles.ctaWrapper} />
          </View>
          <View style={styles.copyIconWrapper}>
            <CopyIcon />
          </View>
        </View>
      )
    })
  }
  return <View style={styles.container}>{renderCard()}</View>
}

export default CoordinatesList

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    width: '90%',
    height: scaleSize(70),
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 10,
    flexDirection: 'row',
    marginVertical: 5,
  },
  card: {
    width: '75%',
    height: '100%',
    backgroundColor: Colors.GRAY_BACKDROP + '1A',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.GRAY_TEXT,
  },
  divider: {
    flex: 1,
  },
  ctaWrapper: {
    margin: 10,
    marginLeft: 10,
  },
  metaWrapper: {
    marginHorizontal: 20,
  },
  coordinateTitle: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: scaleSize(16),
    color: Colors.TEXT_COLOR,
    marginBottom: 5,
  },
  coordinatesLabel: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleSize(12),
    color: Colors.TEXT_LIGHT,
    letterSpacing: 0.2,
  },
  copyIconWrapper: {
    width: '18%',
    height: scaleSize(70),
    backgroundColor: Colors.GRAY_BACKDROP + '1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.GRAY_TEXT,
  },
})
