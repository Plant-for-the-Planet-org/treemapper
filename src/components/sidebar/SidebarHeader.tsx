import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import SingleTreeImage from 'assets/images/svg/PlaceholderAvatar.svg'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont } from 'src/utils/constants/mixins'
import { Skeleton } from 'moti/skeleton'
import ProfileEditIcon from 'assets/images/svg/ProfileEdit.svg'
import openWebView from 'src/utils/helpers/appHelper/openWebView'
import Popover from 'react-native-popover-view'



const SidebarHeader = () => {
  const { image, displayName, email, type } = useSelector(
    (state: RootState) => state.userState,
  )
  const [popupVisible, setPopupVisible] = useState(false)
  const webAuthLoading = useSelector(
    (state: RootState) => state.tempState.webAuthLoading,
  )
  const avatar = `https://${process.env.EXPO_PUBLIC_CDN_URL}/media/cache/profile/avatar/${image}`

  const editHandler = () => {
    openWebView(`https://web.plant-for-the-planet.org/en/profile/edit`);
  }

  const deleteHandler = () => {
    openWebView(`https://web.plant-for-the-planet.org/en/profile/delete-account`);
  }


  const togglePopup = () => {
    setPopupVisible((prev) => !prev)
  }


  const renderIcon = () => {
    return <Popover
      isVisible={popupVisible}
      backgroundStyle={{ opacity: 0 }}
      popoverStyle={{

      }}
      onRequestClose={togglePopup}
      from={(
        <TouchableOpacity style={styles.editMe} onPress={() => setPopupVisible(true)}>
          <ProfileEditIcon />
        </TouchableOpacity>
      )}>
      <View style={styles.popOverWrapper}>
        <Pressable
          style={styles.lgtBtn}
          onPress={editHandler}><Text style={styles.menuLabel}>Edit</Text></Pressable>
        {type !== 'tpo' && <><View style={{ width: '90%', backgroundColor: 'lightgray', height: 1 }} />
          <Pressable onPress={deleteHandler} style={styles.lgtBtn}><Text style={styles.deleteLable}>Delete</Text></Pressable></>}
      </View>
    </Popover>
  }


  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        <Skeleton show={webAuthLoading} colorMode="light" radius={12}>
          {image ? (
            <Image source={{ uri: avatar }} style={styles.imageWrapper} />
          ) : (
            <SingleTreeImage style={styles.imageWrapper} />
          )}
        </Skeleton>
      </View>
      <View style={styles.loaderView}>
        <Skeleton show={webAuthLoading} colorMode="light" radius={12}>
          <Text style={styles.userName}>
            {displayName ? `${displayName}` : 'Guest User'}
          </Text>
        </Skeleton>
        {!!email && <Skeleton show={webAuthLoading} colorMode="light" radius={12}>
          <Text style={styles.emailLabel}>
            {email}
          </Text>
        </Skeleton>}
      </View>
      {!!email && renderIcon()}
    </View>
  )
}

export default SidebarHeader

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  lgtBtn: { height: 50, width: '100%', justifyContent: 'center', alignItems: 'center' },
  popOverWrapper: {
    width: 100,
    justifyContent: 'center',
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: Colors.PALE_WHITE,
    backgroundColor: Colors.WHITE,
    shadowColor: Colors.PALE_WHITE,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 2,
    borderRadius: 8,
    borderEndWidth: 0.5,
  },
  avatarWrapper: {
    width: 50,
    height: 50,
    marginLeft: 20,
    borderRadius: 10,
  },
  userName: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: scaleFont(18),
    color: Colors.DARK_TEXT_COLOR
  },
  emailLabel: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: scaleFont(14),
    color: Colors.TEXT_COLOR
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
  },
  editMe: {
    width: 35,
    height: 35,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: '5%',
    backgroundColor: Colors.NEW_PRIMARY + '1A'
  },
  menuLabel: {
    fontSize: 14,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
  },
  deleteLable: {
    fontSize: 14,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: 'tomato',
  },
})
