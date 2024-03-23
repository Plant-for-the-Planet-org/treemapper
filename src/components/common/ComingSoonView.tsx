import React from 'react'
import {StyleSheet, View} from 'react-native'

import SingleTree from 'assets/images/svg/roundTree.svg'
import GradientText from 'src/components/common/GradientText'

const ComingSoon = () => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 18,
      }}>
      <SingleTree style={{flex: 1}} />
      <View style={styles.container}>
        <GradientText style={{textAlign:'center'}}>
          We're working hard to bring you exciting new features. Stay tuned for
          updates !
        </GradientText>
      </View>
    </View>
  )
}

export default ComingSoon

const styles = StyleSheet.create({
  container: {
    flex: 3,
  },
})
