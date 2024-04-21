import React from 'react'
import { StyleSheet, Text } from 'react-native'

import SingleTree from 'assets/images/svg/roundTree.svg'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'
import { SafeAreaView } from 'react-native-safe-area-context'

const ComingSoon = () => {
  return (
    <SafeAreaView
      style={styles.container}>
      <SingleTree width={"100%"} height={'20%'} />
      <Text style={styles.sectionLabel}>
        We're working hard to bring you exciting new features. Stay tuned for
        updates !
      </Text>
    </SafeAreaView>
  )
}

export default ComingSoon

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.NEW_PRIMARY,
    fontSize: scaleFont(22),
    textAlign: 'center',
    paddingHorizontal:20,
    marginTop:50
  }
})
