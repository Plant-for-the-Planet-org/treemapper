import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import {Colors, Typography} from 'src/utils/constants'
import {scaleSize} from 'src/utils/constants/mixins'
import {SampleTree} from 'src/types/interface/slice.interface'
import WidthIcon from 'assets/images/svg/WidthIcon.svg'
import HeightIcon from 'assets/images/svg/HeightIcon.svg'
import BinIcon from 'assets/images/svg/BinIcon.svg'
import PenIcon from 'assets/images/svg/PenIcon.svg'
import {timestampToBasicDate} from 'src/utils/helpers/appHelper/dataAndTimeHelper'

interface Props {
  sampleTress: SampleTree[]
}

const SampleTreePreviewList = (props: Props) => {
  const {sampleTress} = props
  const hasDetails = sampleTress && sampleTress.length > 0
  const renderCard = () => {
    return sampleTress.map((details, i) => {
      return (
        <View style={styles.wrapper} key={i}>
          <View style={styles.deleteWrapper}>
            <View style={styles.deleteWrapperIcon}>
              <PenIcon width={30} height={30} />
            </View>
            <View style={styles.deleteWrapperIcon}>
              <BinIcon width={18} height={18} fill={Colors.TEXT_COLOR}/>
            </View>
          </View>
          <View style={styles.metaWrapper}>
            <Text style={styles.title}>Intervention Date</Text>
            <Text style={styles.valueLable}>
              {timestampToBasicDate(details.plantation_date)}
            </Text>
          </View>
          <View style={styles.metaWrapper}>
            <Text style={styles.title}>Species</Text>
            <Text style={styles.speciesName}>{details.specie_name}</Text>
          </View>
          <View style={styles.metaWrapper}>
            <Text style={styles.title}>Local common name</Text>
            <Text style={styles.valueLable}>{details.specie_name}</Text>
          </View>
          <View style={styles.dimensionWrapper}>
            <View style={styles.iconWrapper}>
              <Text style={styles.iconTitle}>Height</Text>
              <View style={styles.iconMetaWrapper}>
                <HeightIcon width={20} height={20} />
                <Text style={styles.iconLabel}>{details.specie_height}</Text>
              </View>
            </View>
            <View style={styles.iconWrapper}>
              <Text style={styles.iconTitle}>Width</Text>
              <View style={styles.iconMetaWrapper}>
                <WidthIcon width={20} height={20} />
                <Text style={styles.iconLabel}>{details.specie_diameter}</Text>
              </View>
            </View>
          </View>
          {details.tag_id && (
            <View style={styles.metaWrapper}>
              <Text style={styles.title}>Tag Id</Text>
              <Text style={styles.valueLable}>{details.tag_id}</Text>
            </View>
          )}
        </View>
      )
    })
  }
  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {hasDetails && sampleTress[0].tree_type === 'sample'
          ? 'Sample Trees'
          : 'Tree Details'}
      </Text>
      {renderCard()}
    </View>
  )
}

export default SampleTreePreviewList

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: scaleSize(18),
    color: Colors.TEXT_COLOR,
    marginBottom: 5,
    width: '100%',
    paddingLeft: '10%',
  },
  wrapper: {
    width: '90%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
    borderWidth: 0.5,
    borderColor: Colors.GRAY_TEXT,
    backgroundColor: Colors.GRAY_BACKDROP + '1A',
    borderRadius: 12,
    paddingVertical: 10,
  },
  metaWrapper: {
    width: '100%',
    paddingVertical: 5,
    marginBottom: 10,
  },
  dimensionWrapper: {
    width: '100%',
    paddingVertical: 5,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    flex: 1,
  },
  divider: {
    flex: 1,
  },
  iconMetaWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
  },
  title: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleSize(14),
    color: Colors.TEXT_LIGHT,
    marginLeft: 20,
  },
  valueLable: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleSize(16),
    color: Colors.TEXT_COLOR,
    marginLeft: 20,
  },
  speciesName: {
    fontFamily: Typography.FONT_FAMILY_ITALIC,
    fontSize: scaleSize(16),
    color: Colors.TEXT_COLOR,
    marginLeft: 20,
  },
  iconTitle: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleSize(14),
    color: Colors.TEXT_LIGHT,
    marginLeft: 20,
    marginBottom: 5,
  },
  iconLabel: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleSize(16),
    color: Colors.TEXT_COLOR,
    marginLeft: 5,
  },
  deleteWrapper: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    right: 10,
    top: 10,
  },
  deleteWrapperIcon: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.GRAY_BACKDROP,
    marginLeft: 10,
    borderRadius: 8,
  },
})
