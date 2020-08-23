import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, Text, ScrollView, Switch, TextInput } from 'react-native';
import { Header, PrimaryButton } from '../Common';
import { SafeAreaView } from 'react-native';
import { Colors, Typography } from '_styles';
import i18next from 'i18next';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { LoginDetails } from '../../Actions';
import jwtDecode from 'jwt-decode';
import { SignupService } from '../../Services/Signup';
import Snackbar from 'react-native-snackbar';
import { store } from '../../Actions/store';
import { LoaderActions, SignUpLoader } from '../../Actions/Action';
import {Loader} from '../Common';

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
  const [firstNameError, setFirstNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);
  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState(false);
  const [zipCode, setZipCode] = useState('');
  const [zipCodeError, setZipCodeError] = useState(false);
  const [city, setCity] = useState('');
  const [cityError, setCityError] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [completeCheck, setCompleteCheck] = useState(false);
  const {dispatch, state} = useContext(store);

  const toggleSwitchPublish = () => setMayPublish(previousState => !previousState);
  const toggleSwitchContact = () => setMayContact(previousState => !previousState);
  const SelectType = (type) => {
    let name;
    switch (type) {
      case 'individual':
        name = 'INIDIVDUAL';
        break;
      case 'tpo':
        name ='TREE PLANTING ORGANISATION';
        break;
      case 'school':
        name = 'SCHOOL';
        break;
      case 'company':
        name = 'COMPANY';
        break;
      default:
        name ='TREE PLANTING ORGANISATION';
        break;
    }
    return name;
  };
  const checkValidation = (name) => {
    if (name === 'individual') {
      if (lastname && firstname){
        setCompleteCheck(true);
      }else {
        setCompleteCheck(false);
      }
    } else if(name === 'school' || name === 'company') {
      if (lastname && firstname && nameOfOrg) {
        setCompleteCheck(true);
      } else {
        setCompleteCheck(false);
      }
    } else if(name === 'tpo') {
      if(lastname && firstname && nameOfOrg && zipCode && city && address) {
        setCompleteCheck(true);
      } else {
        setCompleteCheck(false);
      }
    }
  };
  const submitDetails = () => {
    let country;
    country = authDetail.locale.split('-')[1];
    let locale = authDetail.locale;
    let userData;

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
    if (accountType === 'tpo') {
      if (city === '') {
        setCityError(true);
        Snackbar.show({
          text: 'Enter City Name',
          duration: Snackbar.LENGTH_SHORT,
        });
      }
      if (zipCode === '') {
        setZipCodeError(true);
        Snackbar.show({
          text: 'Enter zipcode',
          duration: Snackbar.LENGTH_SHORT,
        });
      }
      if (address === '') {
        setAddressError(true);
        Snackbar.show({
          text: 'Enter Address',
          duration: Snackbar.LENGTH_SHORT,
        });
      }
      if (nameOfOrg === '') {
        setNameError(true);
        Snackbar.show({
          text: 'Enter Organisation Name',
          duration: Snackbar.LENGTH_SHORT,
        });
      }
      if(address && city && zipCode && firstname && lastname && accountType && nameOfOrg) {
        setCompleteCheck(true);
        userData = {
          firstname,
          lastname,
          mayContact,
          mayPublish,
          country,
          locale,
          oAuthAccessToken,
          type: accountType,
          name: nameOfOrg
        };
      }
    } else if (accountType === 'school' || accountType === 'company') {
      if (nameOfOrg === '') {
        setNameError(true);
        Snackbar.show({
          text: 'Enter Organisation Name',
          duration: Snackbar.LENGTH_SHORT,
        });
      }
      if(firstname && lastname && accountType && nameOfOrg) {
        setCompleteCheck(true);
        userData = {
          firstname,
          lastname,
          mayContact,
          mayPublish,
          country,
          locale,
          oAuthAccessToken,
          type: accountType,
          name: nameOfOrg
        };
      }
    }
    else {
      if(firstname && lastname && accountType) {
        setCompleteCheck(true);
        userData = {
          firstname,
          lastname,
          mayContact,
          mayPublish,
          country,
          locale,
          oAuthAccessToken,
          type: accountType
        };
      }
      // SignupService(userData);
    }
    
    if (completeCheck) {
      dispatch(SignUpLoader.setSignUpLoader(true));
      SignupService(userData).then(() => {
        dispatch(SignUpLoader.setSignUpLoader(false));
      });
    }
  };

  useEffect(() => {
    dispatch(LoaderActions.setLoader(false));
    LoginDetails().then((User) => {
      let detail = (Object.values(User));
      let decode = jwtDecode(detail[0].idToken);
      setAuthtAccessToken(detail[0].accessToken);
      setAuthDetails(decode);
      setEmail(decode.email);
    });
  }, []);
  
  useEffect(() => {
    checkValidation(accountType);
  }, [accountType, lastname, firstname, nameOfOrg, address, city, zipCode]);
  return (
    <SafeAreaView style={styles.mainContainer}>
      {state.isSignUpLoader ? <Loader isLoaderShow={true} /> : 
        <View style={styles.container}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <Header
              headingText={i18next.t('label.signup')}
              closeIcon
            />
            <Text style={styles.accountTypeHeader}>{i18next.t('label.account_type')}</Text>
            <View style={styles.selectRoleBtnsContainer}>
              <View
                style={[
                  styles.roleBtnContainer,
                  styles.marginRight,
                  accountType === 'individual' ? styles.activeRoleContainer : null,
                ]}>
                <TouchableOpacity onPress={() => setAccountType('individual')}>
                  <Text style={accountType === 'individual' ? styles.accountTypeText : styles.roleText}>{i18next.t('label.individual')}</Text>
                </TouchableOpacity>
              </View>
              <View
                style={[
                  styles.roleBtnContainer,
                  styles.marginLeft,
                  accountType === 'company' ? styles.activeRoleContainer : null,
                ]}>
                <TouchableOpacity onPress={() => setAccountType('company')}>
                  <Text style={accountType === 'company' ? styles.accountTypeText : styles.roleText}>{i18next.t('label.company')}</Text>
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
                  <Text style={[accountType === 'tpo' ? styles.accountTypeText : styles.roleText]}>
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
                  <Text style={accountType === 'school' ? styles.accountTypeText : styles.roleText}>{i18next.t('label.education_title')}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10, paddingBottom: 10}}>
              {/* <Input label={i18next.t('label.firstname')} value={'Paulina'} /> */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{i18next.t('label.firstname')}</Text>
                <TextInput style={styles.value(firstNameError)} 
                  value={firstname}
                  onChangeText={text => setFirstName(text)}
                // placeholder='Paulina'
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{i18next.t('label.lastname')}</Text>
                <TextInput style={styles.value(lastNameError)} 
                  value={lastname} 
                  onChangeText={text => setLastName(text)}
                // placeholder="Sanchez"
                />
              </View>
            </View>
            {accountType === 'company' || accountType === 'tpo' || accountType === 'school' ? (
              <View style={styles.emailContainer()}>
                <Text style={styles.label}>{i18next.t('label.tpo_title_organisation', { roleText: SelectType(accountType) })}</Text>
                <TextInput style={styles.value(nameError)} 
                  value={nameOfOrg}
                  onChangeText={text => setNameOfOrg(text)}
                // placeholder="Forest in Africa"
                />
          
              </View>
            ) : null}
            <View style={styles.emailContainer('email')}>
              <Text style={styles.label}>{i18next.t('label.email')}</Text>
              <TextInput style={styles.value()} 
                value={email} 
                onChangeText={text => setEmail(text)}
                editable={false}
              />
            </View>
            {accountType === 'tpo' ? (
              <View>
                <View style={styles.emailContainer()}>
                  <Text style={styles.label}>{i18next.t('label.address')}</Text>
                  <TextInput style={styles.value(addressError)} 
                    value={address} 
                    onChangeText={text => setAddress(text)}
                  // placeholder="Some Address"
                  />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 15}}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{i18next.t('label.city')}</Text>
                    <TextInput style={styles.value(cityError)} 
                      value={city} 
                      onChangeText={text => setCity(text)}
                      // placeholder="Chur"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{i18next.t('label.zipcode')}</Text>
                    <TextInput style={styles.value(zipCodeError)} 
                      value={zipCode}
                      onChangeText={text => setZipCode(text)}
                    // placeholder='98212'
                    />
                  </View>
                </View>
              </View>
            ) : null}
            <View style={styles.switchContainer}>
              <Text style={styles.switchContainerText}>{i18next.t('label.mayPublish')}</Text>
              <Switch
                trackColor={{ false: Colors.LIGHT_BORDER_COLOR, true: '#d9e7c0' }}
                thumbColor={mayPublish ? Colors.PRIMARY : Colors.WHITE}
                value={mayPublish}
                onValueChange={toggleSwitchPublish}
                ios_backgroundColor={mayPublish ? Colors.PRIMARY : Colors.WHITE}
              />
            </View>
            <View style={styles.switchContainer, styles.mayContactText}>
              <Text style={styles.switchContainerText}>{i18next.t('label.mayContact')}</Text>
              <Switch
                trackColor={{ false: Colors.LIGHT_BORDER_COLOR, true: '#d9e7c0' }}
                thumbColor={mayContact ? Colors.PRIMARY : Colors.WHITE}
                value={mayContact}
                onValueChange={toggleSwitchContact}
                ios_backgroundColor={Colors.PRIMARY}     
              />
            </View>
          
            <PrimaryButton btnText={i18next.t('label.create_profile')} onPress={submitDetails} textStyle={ completeCheck ? null : styles.textStyle}/>
          </ScrollView>
        </View>}
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
    fontFamily: Typography.FONT_FAMILY_REGULAR
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
    color: Colors.BLACK,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
  },
  switchContainerText: {
    flex: 1,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_16,
    width: '80%'
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
  emailContainer: (email)  => ({
    width: '100%',
    paddingTop: 13,
    paddingBottom:10,
    color: email === 'email' ? Colors.PRIMARY : null,
    fontFamily: Typography.FONT_FAMILY_REGULAR
  }),
  mayContactText: {
    paddingBottom: 10
  },
  accountTypeText: {
    margin: 14,
    color: Colors.PRIMARY,
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    fontSize: Typography.FONT_SIZE_18,
  },
  accountTypeHeader: {
    paddingTop: 30,
    paddingBottom: 8,
    color: Colors.BLACK,
    fontSize: Typography.FONT_SIZE_18,
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD
  },
  textStyle: {
    color: Colors.PRIMARY
  }
});
