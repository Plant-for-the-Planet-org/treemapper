import i18next from 'i18next';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { alrighty_banner } from '../../../assets';
import { Colors, Typography } from '../../../styles';
import Header from '../Header';
import PrimaryButton from '../PrimaryButton';

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
      <View style={styles.container}>
        <Header onBackPress={onPressClose} closeIcon={closeIcon} />
        <View style={{ flex: 1 }}>
          <View style={styles.bannerContainer}>
            <SvgXml xml={bannerImage ? bannerImage : alrighty_banner} />
            <Header
              hideBackIcon
              headingText={heading}
              subHeadingText={subHeading}
              textAlignStyle={styles.headercustomStyle}
              subHeadingStyle={styles.subHeadingStyle}
            />
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
  bannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headercustomStyle: {
    textAlign: 'center',
  },
  bottomBtnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
  },
  subHeadingStyle: {
    lineHeight: Typography.LINE_HEIGHT_24,
  },
});
