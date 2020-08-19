import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Switch, TextInput } from 'react-native';
import { Header, PrimaryButton, Input } from '../Common';
import { SafeAreaView } from 'react-native';
import { Colors, Typography } from '_styles';
import i18next from 'i18next';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { LoginDetails } from '../../Actions';
import jwtDecode from 'jwt-decode';
import { SignupService } from '../../Services/Signup';
import Snackbar from 'react-native-snackbar';

const SignUp = () => {
  const [accountType, setAccountType] = useState('');
  const [lastname, setLastName] = useState('');
  const [firstname, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [nameOfOrg, setNameOfOrg] = useState('');
  const [mayPublish, setMayPublish] = useState(true);
  const [mayContact, setMayContact] = useState(false);
  const [authDetail, setAuthDetails] = useState({});
  const [oAuthAccessToken, setAuthtAccessToken] = useState('');
  const [type, setType] = useState('');
  const [firstNameError, setFirstNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);

  const toggleSwitchPublish = () => setMayPublish(previousState => !previousState);
  const toggleSwitchContact = () => setMayContact(previousState => !previousState);
  const SelectType = (type) => {
    let name;
    switch (type) {
      case 'individual':
        name = 'Individual';
        break;
      case 'tpo':
        name ='Tree Planting Orgainization';
        break;
      case 'school':
        name = 'School';
        break;
      case 'company':
        name = 'Company';
        break;
      default:
        name ='Tree Planting Orgainization';
        break;
    }
    return name;
  };
  const submitDetails = () => {
    if(accountType === '') {
      Snackbar.show({
        text: 'Select Role Type',
        duration: Snackbar.LENGTH_SHORT,
      });
    }

    if (firstname === '') {
      setFirstNameError(true);
      Snackbar.show({
        text: 'Enter first name',
        duration: Snackbar.LENGTH_SHORT,
      });
    }

    if (lastname === ''){
      setLastNameError(true);
      Snackbar.show({
        text: 'Enter last name',
        duration: Snackbar.LENGTH_SHORT,
      });
    }

    if(firstname && lastname && accountType) {
      let country;
      country = authDetail.locale.split('-')[1];
      let locale = authDetail.locale;
      const userData = {
        firstname,
        lastname,
        // email,
        mayContact,
        mayPublish,
        country,
        locale,
        oAuthAccessToken,
        type: accountType
      };
      SignupService(userData);
    }
  };

  useEffect(() => {
    LoginDetails().then((User) => {
      let detail = (Object.values(User));
      let decode = jwtDecode(detail[0].idToken);
      setAuthtAccessToken(detail[0].accessToken);
      setAuthDetails(decode);
    });
  }, []);
  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.container}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <Header
            headingText={i18next.t('label.signup')}
            subHeadingText={i18next.t('label.signup_confirm')}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around'}}>
            {/* <Input label={i18next.t('label.firstname')} value={'Paulina'} /> */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{i18next.t('label.firstname')}</Text>
              <TextInput style={styles.value(firstNameError)} 
                value={firstname}
                onChangeText={text => setFirstName(text)}
                placeholder='Paulina'
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{i18next.t('label.lastname')}</Text>
              <TextInput style={styles.value(lastNameError)} 
                value={lastname} 
                onChangeText={text => setLastName(text)}
                placeholder="Sanchez"
              />
            </View>
            {/* <TextInput style={styles.value} value={lastName} /> */}
            {/* <Input
              label={i18next.t('label.lastname')}
              value={'Sanchez'}
              style={{ marginLeft: 15 }}
              onChangeText={text => setLastName(text)}
              editable
            /> */}
          </View>
          <View style={styles.emailContainer}>
            <Text style={styles.label}>{i18next.t('label.email')}</Text>
            <TextInput style={styles.value()} 
              value={email} 
              onChangeText={text => setEmail(text)}
              placeholder='startplanting@trees.com'
            />
          </View>
          <View style={styles.selectRoleBtnsContainer}>
            <View
              style={[
                styles.roleBtnContainer,
                styles.marginRight,
                accountType === 'individual' ? styles.activeRoleContainer : null,
              ]}>
              <TouchableOpacity onPress={() => setAccountType('individual')}>
                <Text style={styles.roleText}>{i18next.t('label.individual')}</Text>
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.roleBtnContainer,
                styles.marginLeft,
                accountType === 'company' ? styles.activeRoleContainer : null,
              ]}>
              <TouchableOpacity onPress={() => setAccountType('company')}>
                <Text style={styles.roleText}>{i18next.t('label.company')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.selectRoleBtnsContainer}>
            <View
              style={[
                [
                  styles.roleBtnContainer,
                  accountType === 'tpo' ? styles.activeRoleContainer : null,
                ],
                styles.justifyCenter,
                styles.marginRight,
              ]}>
              <TouchableOpacity onPress={() => setAccountType('tpo')}>
                <Text style={[styles.roleText, accountType === 'tpo' ? styles.primaryText : null]}>
                  {i18next.t('label.tpo_title')}
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.roleBtnContainer,
                styles.marginLeft,
                styles.justifyCenter,
                accountType === 'school' ? styles.activeRoleContainer : null,
              ]}>
              <TouchableOpacity onPress={() => setAccountType('school')}>
                <Text style={styles.roleText}>{i18next.t('label.education_title')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* <Input
            label={i18next.t('label.tpo_title_organisation', { roleText: accountType })}
            value={'Forest in Africa'}
          /> */}
          <View style={styles.emailContainer}>
            <Text style={styles.label}>{i18next.t('label.tpo_title_organisation', { roleText: SelectType(accountType) })}</Text>
            <TextInput style={styles.value()} 
              value={nameOfOrg}
              onChangeText={text => setNameOfOrg(text)}
              placeholder="Forest in Africa"
            />

          </View>
          <View style={styles.switchContainer}>
            <Text style={styles.switchContainerText}>{i18next.t('label.mayPublish')}</Text>
            <Switch
              trackColor={{ false: Colors.LIGHT_BORDER_COLOR, true: Colors.PRIMARY }}
              thumbColor={mayPublish ? Colors.PRIMARY : Colors.WHITE}
              value={mayPublish}
              onValueChange={toggleSwitchPublish}
            />
          </View>
          <View style={styles.switchContainer, styles.mayContactText}>
            <Text style={styles.switchContainerText}>{i18next.t('label.mayContact')}</Text>
            <Switch
              trackColor={{ false: Colors.LIGHT_BORDER_COLOR, true: Colors.PRIMARY }}
              thumbColor={mayContact ? Colors.PRIMARY : Colors.WHITE}
              value={mayContact}
              onValueChange={toggleSwitchContact}
            />
          </View>
        </ScrollView>
        <PrimaryButton btnText={i18next.t('label.create_profile')} onPress={submitDetails}/>
      </View>
    </SafeAreaView>
  );
};
export default SignUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: Colors.WHITE,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  cont: {
    flex: 1,
  },
  selectRoleBtnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  roleBtnContainer: {
    height: 80,
    borderWidth: 2,
    flex: 1,
    borderRadius: 10,
    borderColor: Colors.LIGHT_BORDER_COLOR,
    justifyContent: 'flex-end',
  },
  roleText: {
    margin: 14,
    color: Colors.LIGHT_BORDER_COLOR,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
  },
  switchContainerText: {
    flex: 1,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_16,
  },
  switchContainer: {
    flexDirection: 'row',
    paddingVertical: 20,
  },
  primaryText: {
    color: Colors.PRIMARY,
  },
  justifyCenter: {
    justifyContent: 'center',
  },
  activeRoleContainer: {
    borderColor: Colors.PRIMARY,
  },
  marginRight: { marginRight: 5 },
  marginLeft: { marginLeft: 5 },
  value: (invalid) => ({
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: 20,
    // color: Colors.TEXT_COLOR,
    fontWeight: Typography.FONT_WEIGHT_MEDIUM,
    flex: 1,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: invalid  ? 'red' : Colors.TEXT_COLOR,
  }),
  label: {
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_14,
    lineHeight: Typography.LINE_HEIGHT_30,
    color: Colors.TEXT_COLOR,
  },
  inputContainer: {
    width: '49%', 
    paddingLeft: 5
  },
  emailContainer: {
    width: '100%',
    paddingTop: 13
  },
  mayContactText: {
    paddingBottom: 10
  },
});
