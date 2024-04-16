import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import ExploreBackDrop from 'assets/images/svg/ExploreBackDrop.svg'
import Header from 'src/components/common/Header'
import {SCALE_14, SCALE_18} from 'src/utils/constants/spacing'
import {Colors, Typography} from 'src/utils/constants'
import CustomButton from 'src/components/common/CustomButton'
import { scaleSize } from 'src/utils/constants/mixins'
import ExternalLinkIcon from 'assets/images/svg/ExternalLinkIcon.svg'

const DataExplorerView = () => {
  return (
    <>
      <Header label="Data Explorer" />
      <View style={styles.container}>
        <ExploreBackDrop />
        <Text style={styles.header}>Explore Your Data With Ease</Text>
        <Text style={styles.section}>
          Learn from your data with DataExplorer or
        </Text>
        <Text style={styles.section}>
          download it to analyse it in Excel or Python
        </Text>
        <Text>
          {'\n'}
        </Text>
        <Text style={styles.section}>Available for free at pp.eco/explore</Text>
        <Text style={styles.section}>Best on desktop.</Text>
        <CustomButton
        label="Explore Now"
        containerStyle={styles.btnContainer}
        pressHandler={()=>null}
        loading={false}
        leftIcon={<ExternalLinkIcon width={25} height={25}/>}
      />
      </View>
    </>
  )
}

export default DataExplorerView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: SCALE_18,
    color: Colors.DARK_TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    marginBottom:10
  },
  section: {
    fontSize: SCALE_14,
    color: Colors.TEXT_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
  },
  btnContainer: {
    width: '100%',
    height: scaleSize(70),
    position: 'absolute',
    bottom: 0,
  },
  
})
