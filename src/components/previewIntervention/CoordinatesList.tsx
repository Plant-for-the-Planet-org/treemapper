import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React from 'react'
import CtaArrow from 'assets/images/svg/CtaArrow.svg'
import { Colors, Typography } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins'
import CopyIcon from 'assets/images/svg/CopyIcon.svg'
import * as Clipboard from 'expo-clipboard';
import { useToast } from "react-native-toast-notifications";


interface Props {
  coordinates: Array<number[]>
  type: string
}

const CoordinatesList = (props: Props) => {
  const toast = useToast();

  const { coordinates, type } = props
  const listCoord = type === 'Polygon' ? coordinates : coordinates
  if (listCoord.length > 10) {
    return null
  }

  const copyToClipboard = async (el: string) => {
    await Clipboard.setStringAsync(el);
    toast.show("Coordinates Copied", {
      type: "normal",
      placement: "bottom",
      duration: 2000,
      animationType: "slide-in",
    })
  };


  const renderCard = () => {
    return listCoord.map((el, i) => {
      if (type === 'Polygon' && i === listCoord.length-1) {
        return null
      }
      return (
        <View style={styles.wrapper} key={i}>
          <View style={styles.card}>
            <View style={styles.metaWrapper}>
              <Text style={styles.coordinateTitle}>Coordinate {type === 'Polygon' ? `${String.fromCharCode(i + 65)}` : ""}</Text>
              <Text style={styles.coordinatesLabel}>
                {`${el[0].toFixed(6)}`},{`${el[1].toFixed(6)}`}
              </Text>
            </View>
            <View style={styles.divider} />
            <CtaArrow style={styles.ctaWrapper} />
          </View>
          <TouchableOpacity style={styles.copyIconWrapper} onPress={() => {
            copyToClipboard(`${el[0].toFixed(6)},${el[1].toFixed(6)}`)
          }}>
            <CopyIcon />
          </TouchableOpacity>
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
    backgroundColor: Colors.GRAY_BACKDROP,
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
    color: Colors.TEXT_COLOR,
    letterSpacing: 0.2,
  },
  copyIconWrapper: {
    width: '18%',
    height: scaleSize(70),
    backgroundColor: Colors.GRAY_BACKDROP,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.GRAY_TEXT,
  },
})
