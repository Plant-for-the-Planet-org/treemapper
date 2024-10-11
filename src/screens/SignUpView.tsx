import { ScrollView, StyleSheet, Text, TextInput, View, Switch, TouchableOpacity, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import Header from 'src/components/common/Header'
import CustomButton from 'src/components/common/CustomButton'
import CtaArrow from 'assets/images/svg/CtaArrow.svg'
import { AvoidSoftInput, AvoidSoftInputView } from 'react-native-avoid-softinput'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import i18next from 'i18next'
import Snackbar from 'react-native-snackbar'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { handleFilter } from 'src/utils/constants/CountryDataFilter'
import CountryModal from 'src/components/common/CountryModal'
import { CountryCode } from 'src/types/interface/slice.interface'
import SignUpOutline from 'src/components/common/SignUpOutline'
import * as Localization from 'expo-localization';
import { getLocales } from 'expo-localization'
import { createUserProfile, getUserDetails } from 'src/api/api.fetch'
import { useDispatch, useSelector } from 'react-redux'
import Bugsnag from '@bugsnag/expo'
import { logoutAppUser, updateUserLogin } from 'src/store/slice/appStateSlice'
import { updateWebAuthLoading } from 'src/store/slice/tempStateSlice'
import { resetUserDetails, updateUserDetails } from 'src/store/slice/userStateSlice'
import useAuthentication from 'src/hooks/useAuthentication'
import useLogManagement from 'src/hooks/realm/useLogManagement'
import { useToast } from 'react-native-toast-notifications'
import { RootState } from 'src/store'




const SignUpView = () => {
    const [accountType, setAccountType] = useState('tpo');
    const [lastName, setLastName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [nameOfOrg, setNameOfOrg] = useState('');
    const [isPrivate, setIsPrivate] = useState(true);
    const [getNews, setGetNews] = useState(false);
    const [address, setAddress] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [city, setCity] = useState('');
    const userDetails = useSelector(
        (state: RootState) => state.userState,
    )
    const [firstNameError, setFirstNameError] = useState(false);
    const [lastNameError, setLastNameError] = useState(false);
    const [addressError, setAddressError] = useState(false);
    const [zipCodeError, setZipCodeError] = useState(false);
    const [cityError, setCityError] = useState(false);
    const [nameError, setNameError] = useState(false);

    const { logoutUser } = useAuthentication()
    const { addNewLog } = useLogManagement()

    const toast = useToast()


    useEffect(() => {
        if (userDetails && userDetails.firstName) {
            setFirstName(userDetails.firstName)
            setLastName(userDetails.lastName)
        }
    }, [userDetails])




    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const route = useRoute<RouteProp<RootStackParamList, 'SignUpPage'>>()
    const emailID = route.params?.email;
    const accessToken = route.params?.accessToken;
    const [loading, setLoading] = useState(false)

    const dispatch = useDispatch()

    const [completeCheck, setCompleteCheck] = useState(false);
    const [country, setCountry] = useState<CountryCode>({
        countryCode: "",
        countryName: "",
        currencyCode: "",
        currencyCountryFlag: "",
        currencyName: ""
    });
    const [modalVisible, setModalVisible] = useState(false);

    const toggleSwitchPublish = () => setIsPrivate((previousState) => !previousState);
    const toggleSwitchContact = () => setGetNews((previousState) => !previousState);

    const cdnUrl = process.env.EXPO_PUBLIC_CDN_URL
    const protocol = process.env.EXPO_PUBLIC_API_PROTOCOL

    useEffect(() => {
        initializeData()
        AvoidSoftInput.setShouldMimicIOSBehavior(true);
        return () => {
            dispatch(updateWebAuthLoading(false))
            AvoidSoftInput.setShouldMimicIOSBehavior(false);
            handleLogout()
        };
    }, [])

    const initializeData = () => {
        if (Localization.region) {
            const data: CountryCode[] = handleFilter(Localization.region)
            if (data.length > 0) {
                setCountry(data[0])
            }
        }
    }


    useEffect(() => {
        checkValidation(accountType);
    }, [accountType, lastName, firstName, nameOfOrg, address, city, zipCode, country])

    const loginAndUpdateDetails = async data => {
        const finalDetails = { ...data }
        dispatch(updateUserDetails(finalDetails))
        dispatch(updateUserLogin(true))
        dispatch(updateWebAuthLoading(false))
    }


    const SelectType = (type) => {
        let name;
        switch (type) {
            case 'individual':
                name = "Individual"
                break;
            case 'tpo':
                name = "Tree Planting Organisation"
                break;
            case 'education':
                name = "School"
                break;
            case 'company':
                name = "Company"
                break;
            default:
                name = "Tree Planting Organisation"
                break;
        }
        return name;
    };

    const checkValidation = (name: string) => {
        const requiredFields: { [key: string]: boolean } = {
            'individual': !!lastName && !!firstName && !!country,
            'education': !!lastName && !!firstName && !!nameOfOrg && !!country,
            'company': !!lastName && !!firstName && !!nameOfOrg && !!country,
            'tpo': !!lastName && !!firstName && !!nameOfOrg && !!zipCode && !!city && !!address && !!country,
        };
        setCompleteCheck(!!requiredFields[name]);
    }

    const openModal = (data) => {
        setModalVisible(data);
    };

    const userCountry = (data: CountryCode) => {
        setCountry(data);
        setModalVisible(!modalVisible);
    };

    const showSnackbar = (message: string) => {
        Snackbar.show({
            text: i18next.t(message),
            duration: Snackbar.LENGTH_SHORT,
        });
    };

    const validateField = (field, errorSetter, errorMessage) => {
        if (field === '') {
            errorSetter(true);
            showSnackbar(errorMessage);
            return false;
        }
        return true;
    };

    const validateOrgFields = () => {
        let isValid = true;

        // Organization-specific fields
        isValid = validateField(nameOfOrg, setNameError, 'label.enter_organisation_name') && isValid;

        if (accountType === 'tpo') {
            isValid = validateField(city, setCityError, 'label.enter_city_name') && isValid;
            isValid = validateField(zipCode, setZipCodeError, 'label.enter_zipcode') && isValid;
            isValid = validateField(address, setAddressError, 'label.enter_address') && isValid;
        }

        return isValid;
    };

    const validateFields = () => {
        let isValid = true;

        // Basic fields
        isValid = accountType === '' ? (showSnackbar('label.select_role_type'), false) : isValid;
        isValid = validateField(firstName, setFirstNameError, 'label.enter_first_name') && isValid;
        isValid = validateField(lastName, setLastNameError, 'label.enter_last_name') && isValid;

        // Organization validation
        if (accountType === 'tpo' || accountType === 'education' || accountType === 'company') {
            isValid = validateOrgFields() && isValid;
        }

        return isValid;
    };

    const buildUserData = (): any => {
        const commonData = {
            firstname: firstName,
            lastname: lastName,
            getNews,
            isPrivate,
            country: country.countryCode,
            locale: getLocales()[0]?.languageCode,
            oAuthAccessToken: accessToken,
            type: accountType,
        };

        if (accountType === 'tpo') {
            return {
                ...commonData,
                city,
                zipCode,
                address,
                name: nameOfOrg,
            };
        }
        if (accountType === 'education' || accountType === 'company') {
            return {
                ...commonData,
                name: nameOfOrg,
            };
        }
        return commonData;
    };

    const submitDetails = async () => {
        if (!validateFields()) {
            return;
        }

        const userData = buildUserData();
        setLoading(true);

        const { success } = await createUserProfile(userData);

        if (success) {
            const { response, success: detailsSuccess } = await getUserDetails();
            if (detailsSuccess && response) {
                loginAndUpdateDetails(response);
                navigation.goBack();
            } else {
                Bugsnag.notify("/app/profile failed to fetch user details");
                addNewLog({
                    logType: 'USER',
                    message: "User details api failed to fetch data",
                    logLevel: 'error',
                    statusCode: '',
                });
                dispatch(updateWebAuthLoading(false));
                handleLogout();
            }
        }
    };

    const handleLogout = async () => {
        try {
            toast.show("Profile Creation failed")
            await logoutUser()
            dispatch(updateUserLogin(false))
            dispatch(resetUserDetails())
            dispatch(logoutAppUser())
            navigation.goBack()
        } catch (error) {
            console.log("Error occurred while logout")
        }
    }




    return (
        <View style={styles.container}>
            <Header label='Complete Sign Up' />
            <CountryModal visible={modalVisible} openModal={openModal} userCountry={userCountry} />
            <ScrollView showsVerticalScrollIndicator={false}>
                <AvoidSoftInputView
                    avoidOffset={20}
                    showAnimationDuration={220}
                    style={styles.mainContainer}
                >
                    <View style={styles.wrapper}>
                        <Text style={styles.headline}>Account Type</Text>
                        <View style={styles.typeContainer}>
                            <TouchableOpacity style={[styles.typeWrapper, { backgroundColor: accountType === 'individual' ? Colors.NEW_PRIMARY : Colors.WHITE }]} onPress={() => setAccountType('individual')}>
                                <Text style={[styles.typeLabel, { color: accountType === 'individual' ? Colors.WHITE : Colors.TEXT_COLOR }]}>Individual</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.typeWrapper, { backgroundColor: accountType === 'company' ? Colors.NEW_PRIMARY : Colors.WHITE }]} onPress={() => setAccountType('company')}>
                                <Text style={[styles.typeLabel, { color: accountType === 'company' ? Colors.WHITE : Colors.TEXT_COLOR }]}>Company</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.typeContainer}>
                            <TouchableOpacity style={[styles.typeWrapper, { backgroundColor: accountType === 'tpo' ? Colors.NEW_PRIMARY : Colors.WHITE }]} onPress={() => setAccountType('tpo')}>
                                <Text style={[styles.typeLabel, { color: accountType === 'tpo' ? Colors.WHITE : Colors.TEXT_COLOR }]}>Tree Planting {'\n'}Organisation</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.typeWrapper, { backgroundColor: accountType === 'education' ? Colors.NEW_PRIMARY : Colors.WHITE }]} onPress={() => setAccountType('education')}>
                                <Text style={[styles.typeLabel, { color: accountType === 'education' ? Colors.WHITE : Colors.TEXT_COLOR }]}>School</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.textInputWrapper}
                            placeholder='First Name'
                            value={firstName}
                            onChangeText={setFirstName}
                            returnKeyType={completeCheck ? 'done' : 'next'}
                        />
                        {!!firstNameError && <Text style={styles.errorLabel}>{firstNameError}</Text>}
                        <TextInput
                            style={styles.textInputWrapper}
                            placeholder='Last Name'
                            onChangeText={setLastName}
                            value={lastName}
                            returnKeyType={completeCheck ? 'done' : 'next'}
                        />
                        {!!lastNameError && <Text style={styles.errorLabel}>{lastNameError}</Text>}
                        <Text style={styles.countryTitle}>Country</Text>
                        <TouchableOpacity style={styles.countryWrapper} onPress={() => { setModalVisible(!modalVisible) }}>
                            {!!country?.countryCode && <View style={styles.countryFlag}>
                                <Image
                                    source={{
                                        uri: `${protocol}://${cdnUrl}/media/images/flags/png/256/${country.countryCode}.png`
                                    }}
                                    resizeMode="contain"
                                    style={styles.countryFlag}
                                />
                            </View>}
                            <View style={styles.countryMeta}>
                                <Text style={styles.countryLabel}>{country.countryCode ? country.countryName : "Select Country"}</Text>
                                <View style={{ flexDirection: "row", alignItems: 'center' }}><Text style={styles.countryChangeLabel}>Change country</Text><CtaArrow style={{ marginTop: 3 }} height={10} /></View>
                            </View>
                        </TouchableOpacity>
                        {accountType === 'company' || accountType === 'tpo' || accountType === 'education' ? (
                            <>
                                <TextInput
                                    style={styles.textInputWrapper}
                                    placeholder={`Name Of ${SelectType(accountType)}`}
                                    onChangeText={setNameOfOrg}
                                    returnKeyType={completeCheck ? 'done' : 'next'}
                                />
                                {!!nameError && <Text style={styles.errorLabel}>{nameError}</Text>}
                            </>
                        ) : null}
                        <SignUpOutline
                            placeholder={'Email'}
                            keyboardType={'default'}
                            value={emailID} errMsg={''} />
                        {accountType === 'tpo' ? (
                            <>
                                <TextInput
                                    style={styles.textInputWrapper}
                                    placeholder={'Address'}
                                    onChangeText={setAddress}
                                    returnKeyType={completeCheck ? 'done' : 'next'}
                                />
                                {!!addressError && <Text style={styles.errorLabel}>{addressError}</Text>}
                                <View style={{ flexDirection: 'row', justifyContent: "space-between", width: "100%" }}>
                                    <View style={styles.addressWrapper}>
                                        <TextInput
                                            style={styles.textInputWrapper}
                                            placeholder={'City'}
                                            onChangeText={setCity}
                                            returnKeyType={completeCheck ? 'done' : 'next'}
                                        />
                                    </View>
                                    <View style={styles.addressWrapper}>
                                        <TextInput
                                            style={styles.textInputWrapper}
                                            placeholder={'Zip Code'}
                                            onChangeText={setZipCode}
                                            returnKeyType={completeCheck ? 'done' : 'next'}
                                        />
                                    </View>
                                    {!!zipCodeError && <Text style={styles.errorLabel}>{zipCodeError}</Text>}
                                    {!!cityError && <Text style={styles.errorLabel}>{cityError}</Text>}
                                </View>
                            </>
                        ) : null}

                        <View style={styles.infoSwitchWrapper}>
                            <Text style={styles.infoText}>I agree to have my name published in the Plant-for-the-Planet Website and App.</Text>
                            <View style={styles.switch}>
                                <Switch
                                    value={isPrivate}
                                    trackColor={{ false: Colors.LIGHT_BORDER_COLOR, true: '#d9e7c0' }}
                                    onValueChange={toggleSwitchPublish}
                                    thumbColor={isPrivate ? Colors.NEW_PRIMARY : Colors.WHITE}
                                    ios_backgroundColor={isPrivate ? Colors.NEW_PRIMARY : Colors.GRAY_LIGHT}
                                />
                            </View>
                        </View>
                        <View style={styles.infoSwitchWrapper}>
                            <Text style={styles.infoText}>I agree that I many be contacted by the children and youth organization Plant-for-the-Planet as part of tree planting news and challenges.</Text>
                            <View style={styles.switch}>
                                <Switch
                                    trackColor={{ false: Colors.LIGHT_BORDER_COLOR, true: '#d9e7c0' }}
                                    thumbColor={getNews ? Colors.NEW_PRIMARY : Colors.WHITE}
                                    value={getNews}
                                    onValueChange={toggleSwitchContact}
                                    ios_backgroundColor={getNews ? Colors.NEW_PRIMARY : Colors.GRAY_LIGHT}
                                />
                            </View>
                        </View>
                        <CustomButton
                            label={"Create Profile"}
                            containerStyle={styles.btnContainer}
                            pressHandler={submitDetails}
                            loading={loading}
                            hideFadeIn
                        />
                    </View>
                </AvoidSoftInputView>
            </ScrollView>

        </View>
    )
}

export default SignUpView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE,
        paddingTop: 40
    },
    divider: {
        width: '100%',
        height: 100
    },
    mainContainer: {
        flex: 1,
        alignItems: "center",
        width: "100%",
        backgroundColor: Colors.BACKDROP_COLOR
    },
    wrapper: {
        width: "90%",
        alignItems: 'center',
    },
    headline: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_COLOR,
        marginTop: 20,
        width: '100%',
    },
    typeContainer: {
        height: 100,
        width: '100%',
        flexDirection: 'row',
        marginTop: 20,
        justifyContent: 'space-between',
    },
    typeWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: Colors.TEXT_COLOR,
        borderRadius: 12,
        width: '48%',
        height: '100%',
        backgroundColor: Colors.WHITE
    },
    typeLabel: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR
    },
    textInputWrapper: {
        width: '100%',
        height: 50,
        borderWidth: 0.5,
        borderColor: Colors.TEXT_LIGHT,
        paddingHorizontal: 20,
        marginTop: 20,
        borderRadius: 12,
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        backgroundColor: Colors.WHITE
    },
    countryTitle: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        marginTop: 20,
        width: '100%',
        color: Colors.TEXT_COLOR
    },
    countryWrapper: {
        width: '100%',
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
    },
    countryFlag: {
        width: 80,
        height: 60,
    },
    countryMeta: {
        width: '90%',
        height: '80%',
        justifyContent: 'space-between',
        marginLeft: 20
    },
    countryLabel: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR
    },
    countryChangeLabel: {
        fontSize: 12,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.NEW_PRIMARY,
        marginRight: 5
    },
    infoSwitchWrapper: {
        flexDirection: 'row',
        marginTop: 20,
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center'
    },
    infoText: {
        fontSize: 14,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_COLOR,
        textAlign: "left",
        width: '80%'
    },
    switch: {
        height: 40,
        marginRight: 10
    },
    btnContainer: {
        width: '100%',
        height: 70,
        marginTop: 40,
        marginBottom: 50
    },
    addressWrapper: {
        width: '48%',
    },
    errorLabel: {
        marginTop: 5,
        fontSize: 14,
        color: Colors.LIGHT_AMBER,
        fontFamily: Typography.FONT_FAMILY_REGULAR
    }
})