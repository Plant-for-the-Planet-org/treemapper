import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Modal, Switch } from 'react-native';
import { Header, LargeButton, PrimaryButton, Alrighty, Input } from '../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';
import { addLocateTree, updateLastScreen } from '../../Actions'
import { store } from '../../Actions/store';
import JailMonkey from 'jail-monkey';
import { color } from 'react-native-reanimated';


const SignUp = ({ navigation }) => {


    return (
        <SafeAreaView style={styles.mainContainer}>
            <View style={styles.container}>
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    <Header headingText={'Sign Up'} subHeadingText={'Please confirm your details.'} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Input label={'FIRST NAME'} value={'Paulina'} />
                        <Input label={'LAST NAME'} value={'Sanchez'} style={{ marginLeft: 15 }} />
                    </View>
                    <Input label={'EMAIL'} value={'startplanting@trees.com'} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 }}>
                        <View style={{ height: 80, borderWidth: 2, flex: 1, borderRadius: 10, borderColor: Colors.PRIMARY, justifyContent: 'flex-end', marginRight: 5 }}>
                            <Text style={{
                                margin: 14, color: Colors.PRIMARY,
                                fontFamily: Typography.FONT_FAMILY_BOLD,
                                fontSize: Typography.FONT_SIZE_18,
                            }}>Individual</Text>
                        </View>
                        <View style={{ height: 80, borderWidth: 2, flex: 1, borderRadius: 10, borderColor: Colors.LIGHT_BORDER_COLOR, justifyContent: 'flex-end', marginLeft: 5 }}>
                            <Text style={{
                                margin: 14, color: Colors.LIGHT_BORDER_COLOR,
                                fontFamily: Typography.FONT_FAMILY_BOLD,
                                fontSize: Typography.FONT_SIZE_18,
                            }}>Company</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 }}>
                        <View style={{ height: 80, borderWidth: 2, flex: 1, borderRadius: 10, borderColor: Colors.PRIMARY, justifyContent: 'center', marginRight: 5, alignItems: 'center' }}>
                            <Text style={{

                                color: Colors.PRIMARY,
                                fontFamily: Typography.FONT_FAMILY_BOLD,
                                fontSize: Typography.FONT_SIZE_18,
                            }}>Tree Planting Organisation</Text>
                        </View>
                        <View style={{ height: 80, borderWidth: 2, flex: 1, borderRadius: 10, borderColor: Colors.LIGHT_BORDER_COLOR, justifyContent: 'flex-end', marginLeft: 5 }}>
                            <Text style={{
                                margin: 14, color: Colors.LIGHT_BORDER_COLOR,
                                fontFamily: Typography.FONT_FAMILY_BOLD,
                                fontSize: Typography.FONT_SIZE_18,
                            }}>School</Text>
                        </View>
                    </View>
                    <Input label={'NAME OF TREE PLANTING ORGANIZATION'} value={'Forest in Africa'} />
                    <View style={{ flexDirection: 'row', paddingVertical: 20 }}>
                        <Text style={{
                            flex: 1,
                            fontFamily: Typography.FONT_FAMILY_REGULAR,
                            fontSize: Typography.FONT_SIZE_16,
                        }}>I agree to have my name published on the Plant-for-the-Planet App.</Text>
                        <Switch
                            trackColor={{ false: Colors.LIGHT_BORDER_COLOR, true: Colors.PRIMARY }}
                            thumbColor={!false ? Colors.PRIMARY : Colors.WHITE}
                            value={!false}
                        />
                    </View>
                    <View style={{ flexDirection: 'row', paddingVertical: 20 }}>
                        <Text style={{
                            flex: 1, fontFamily: Typography.FONT_FAMILY_REGULAR,
                            fontSize: Typography.FONT_SIZE_16,
                        }}>I agree that I may be contacted by Plant-for-the-Planet as a part of Tree Planting news and challenges.</Text>
                        <Switch
                            trackColor={{ false: Colors.LIGHT_BORDER_COLOR, true: Colors.PRIMARY }}
                            thumbColor={!false ? Colors.PRIMARY : Colors.WHITE}
                            value={!false}
                        />
                    </View>
                </ScrollView>
                <PrimaryButton btnText={'Continue'} />
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
    addSpecies: {
        color: Colors.ALERT,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_30,
        textAlign: 'center'
    }
})