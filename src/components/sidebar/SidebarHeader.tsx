import { Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import SingleTreeImage from 'assets/images/svg/SingleTreeIcon.svg'
import { Typography } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'

const SidebarHeader = () => {
  const { image, displayName } = useSelector(
    (state: RootState) => state.userState,
  )
  const avatar = `https://${process.env.EXPO_PUBLIC_CDN_URL}/media/cache/profile/avatar/${image}`

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        {image ? (
          <Image source={{ uri: avatar }} style={styles.imageWrapper} />
        ) : (
          <SingleTreeImage style={styles.imageWrapper} />
        )}
      </View>
      <Text style={styles.userName}>
        {displayName ? `${displayName}` : 'Guest User'}
      </Text>
    </View>
  )
}

export default SidebarHeader

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarWrapper: {
    width: 50,
    height: 50,
    marginLeft: 20,
    borderRadius: 10,
  },
  userName: {
    marginLeft: 20,
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: scaleFont(20)
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
})
