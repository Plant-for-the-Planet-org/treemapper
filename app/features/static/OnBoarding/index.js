import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native';
// import WelcomeScreen1 from './screens/Screen1';
// import WelcomeScreen2 from './screens/Screen2';
// import WelcomeScreen3 from './screens/Screen3';
// import WelcomeScreen4 from './screens/Screen4';
// import WelcomeScreen5 from './screens/Screen5';
import lang from '_languages/languages';
import styless from './styles/WelcomeScreen5';
import Swiper from 'react-native-swiper'

const OnBoarding = ({ navigation }) => {
  // const appHomePage = () => updateRoute('app_homepage', navigation);
  const Footer = () => {
    return (
      <View style={{ backgroundColor: '#fff', marginTop: 16 }}>
        <View style={styless.bottomRow}>
          {/* <PrimaryButton
            // onClick={() => updateRoute('app_signup', navigation)}
            buttonStyle={styless.buttonStyle}
          > */}
            <Text style={styless.continueBtn}>
              {lang.t('label.welcome_scrn_5_create_an_account')}
            </Text>
          {/* </PrimaryButton> */}
        </View>
        <View style={styless.bottomRow}>
          {/* <PrimaryButton
            onClick={() => updateRoute('app_login', navigation)}
            buttonStyle={styless.lowerBtnStyle}
          > */}
            <Text style={styless.alreadyHaveAccountBtn}>
              {lang.t('label.welcome_scrn_5_already_have_an_account')}
              <Text style={styless.signInBtn}>
                {' '}
                {lang.t('label.welcome_scrn_5_sign_in')}
              </Text>
            </Text>
          {/* </PrimaryButton> */}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Swiper
        showsButtons={false}
        activeDotColor={'#89b53a'}
        paginationStyle={{ bottom: -5 }}
      >
        <View style={styles.container}>
          {/* <WelcomeScreen1 /> */}
        </View>
        <View style={styles.container}>
          {/* <WelcomeScreen2 /> */}
        </View>
        <View style={styles.container}>
          {/* <WelcomeScreen3 /> */}
        </View>
        <View style={styles.container}>
          {/* <WelcomeScreen4 /> */}
        </View>
        <View style={styles.container}>
          {/* <WelcomeScreen5 /> */}
        </View>
      </Swiper>
      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 }
});
export default OnBoarding;
