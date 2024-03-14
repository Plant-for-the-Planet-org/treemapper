import React from 'react';
import i18next from 'i18next';
import { SvgXml } from 'react-native-svg';
import { SafeAreaView, StyleSheet, View, Text } from 'react-native';

import Header from 'src/components/common/Header';
import PrimaryButton from 'src/components/common/PrimaryButton';
// import { alrighty_banner } from '../../../assets'; Code Migration
import { Colors, Typography } from 'src/utils/constants';

interface IAlrightyProps {
  heading: any;
  subHeading: any;
  onPressClose: any;
  onPressContinue: any;
  coordsLength?: any;
  onPressWhiteButton: any;
  whiteBtnText?: any;
  bannerImage?: any;
  closeIcon?: any;
}

const Alrighty = ({
  heading,
  subHeading,
  onPressClose,
  onPressContinue,
  coordsLength,
  onPressWhiteButton,
  whiteBtnText,
  bannerImage,
  closeIcon,
}: IAlrightyProps) => {
  const isShowBottomWhiteBtn = whiteBtnText || coordsLength > 2;
  return (
    <SafeAreaView style={styles.mainContainer}>
      <Header onBackPress={onPressClose} closeIcon={closeIcon} containerStyle={styles.header} />
      <View style={styles.container}>
        <SvgXml xml={bannerImage ? bannerImage : 'alrighty_banner'} />
        <View style={styles.infoContainer}>
          <Text style={styles.heading}>{heading}</Text>
          <Text style={styles.subHeading}>{subHeading}</Text>
        </View>
      </View>
      <View style={styles.bottomBtnsContainer}>
        {isShowBottomWhiteBtn && (
          <PrimaryButton
            onPress={onPressWhiteButton}
            btnText={coordsLength >= 2 ? i18next.t('label.tree_review_alrighty') : whiteBtnText}
            halfWidth
            theme={'white'}
          />
        )}
        <PrimaryButton
          onPress={onPressContinue}
          btnText={i18next.t('label.continue')}
          halfWidth={isShowBottomWhiteBtn}
        />
      </View>
    </SafeAreaView>
  );
};
export default Alrighty;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  header: {
    paddingHorizontal: 25,
  },
  container: {
    flex: 0.8,
    paddingHorizontal: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontFamily: Typography.FONT_FAMILY_BOLD,
    fontSize: Typography.FONT_SIZE_20,
    color: Colors.BLACK,
    textAlign: 'center',
    lineHeight: Typography.LINE_HEIGHT_40,
  },
  subHeading: {
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
    textAlign: 'center',
  },
  infoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBtnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    bottom: 25,
    position: 'absolute',
    width: '90%',
    alignSelf: 'center',
  },
});
