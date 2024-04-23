import { Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import SingleTreeImage from 'assets/images/svg/SingleTreeIcon.svg'
import { Typography } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'
import { Skeleton } from 'moti/skeleton'



const SidebarHeader = () => {
  const { image, displayName, loading } = useSelector(
    (state: RootState) => state.userState,
  )
  const avatar = `https://${process.env.EXPO_PUBLIC_CDN_URL}/media/cache/profile/avatar/${image}`

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        <Skeleton show={loading} colorMode="light" radius={12}>
          {image ? (
            <Image source={{ uri: avatar }} style={styles.imageWrapper} />
          ) : (
            <SingleTreeImage style={styles.imageWrapper} />
          )}
        </Skeleton>
      </View>
      <View style={styles.loaderView}>
        <Skeleton show={loading} colorMode="light" radius={12}>
          <Text style={styles.userName}>
            {displayName ? `${displayName}` : 'Guest User'}
          </Text>
        </Skeleton>
      </View>
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
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: scaleFont(20),
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  loaderView: {
    justifyContent: "center",
    height: '100%',
    paddingHorizontal: 10,
    width: '70%'
  }
})
