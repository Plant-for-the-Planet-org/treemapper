/* eslint-disable prettier/prettier */
import React from 'react';
import { View, StyleSheet, Text, ScrollView, Switch } from 'react-native';
import { Header, PrimaryButton, Input } from '../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';
import i18next from 'i18next';


const SignUp = ({ }) => {
    return (
        <SafeAreaView style={styles.mainContainer}>
            <View style={styles.container}>
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    <Header headingText={i18next.t('label.signup')} subHeadingText={i18next.t('label.signup_confirm')} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Input label={i18next.t('label.firstname')} value={'Paulina'} />
                        <Input label={i18next.t('label.lastname')} value={'Sanchez'} style={{ marginLeft: 15 }} />
                    </View>
                    <Input label={i18next.t('label.email')} value={'startplanting@trees.com'} />
                    <View style={styles.selectRoleBtnsContainer}>
                        <View style={[styles.roleBtnContainer, styles.marginRight]}>
                            <Text style={styles.roleText}>{i18next.t('label.individual')}</Text>
                        </View>
                        <View style={[styles.roleBtnContainer, styles.marginLeft]}>
                            <Text style={styles.roleText}>{i18next.t('label.company')}</Text>
                        </View>
                    </View>
                    <View style={styles.selectRoleBtnsContainer}>
                        <View style={[[styles.roleBtnContainer, styles.activeRoleContainer], styles.justifyCenter, styles.marginRight]}>
                            <Text style={[styles.roleText, styles.primaryText]}>{i18next.t('label.tpo_title')}</Text>
                        </View>
                        <View style={[styles.roleBtnContainer, styles.marginLeft]}>
                            <Text style={styles.roleText}>{i18next.t('label.education_title')}</Text>
                        </View>
                    </View>
                    <Input label={i18next.t('label.tpo_title_organisation')} value={'Forest in Africa'} />
                    <View style={styles.switchContainer}>
                            <Text style={styles.switchContainerText}>{i18next.t('label.mayPublish')}</Text>
                        <Switch trackColor={{ false: Colors.LIGHT_BORDER_COLOR, true: Colors.PRIMARY }} thumbColor={!false ? Colors.PRIMARY : Colors.WHITE} value={!false} />
                    </View>
                    <View style={styles.switchContainer}>
                            <Text style={styles.switchContainerText}>{i18next.t('label.mayContact')}</Text>
                        <Switch trackColor={{ false: Colors.LIGHT_BORDER_COLOR, true: Colors.PRIMARY }} thumbColor={false ? Colors.PRIMARY : Colors.WHITE} value={false} />
                    </View>
                </ScrollView>
                <PrimaryButton btnText={i18next.t('label.create_profile')} />
            </View>
        </SafeAreaView>
    )
}
export default SignUp;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 25,
        backgroundColor: Colors.WHITE
    },
    mainContainer: {
        flex: 1, backgroundColor: Colors.WHITE,
    },
    cont: {
        flex: 1,
    },
    selectRoleBtnsContainer: {
        flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10
    },
    roleBtnContainer: {
        height: 80, borderWidth: 2, flex: 1, borderRadius: 10, borderColor: Colors.LIGHT_BORDER_COLOR, justifyContent: 'flex-end',
    },
    roleText: {
        margin: 14, color: Colors.LIGHT_BORDER_COLOR,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
    },
    switchContainerText: {
        flex: 1,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_16,
    },
    switchContainer: {
        flexDirection: 'row', paddingVertical: 20
    },
    primaryText: {
        color: Colors.PRIMARY
    },
    justifyCenter: {
        justifyContent: 'center'
    },
    activeRoleContainer: {
        borderColor: Colors.PRIMARY
    },
    marginRight: { marginRight: 5 },
    marginLeft: { marginLeft: 5 },
})