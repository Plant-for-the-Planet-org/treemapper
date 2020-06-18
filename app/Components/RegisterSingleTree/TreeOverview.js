import React from 'react';
import { View, StyleSheet, ScrollView, Image, Text } from 'react-native';
import { Header, PrimaryButton } from '../Common';
import { SafeAreaView } from 'react-native'
import { Colors, Typography } from '_styles';
import { placeholder_image } from '../../assets'
import LinearGradient from 'react-native-linear-gradient';
import FIcon from 'react-native-vector-icons/Fontisto'
const SingleTreeOverview = ({ }) => {

    const renderDetails = () => {
        return (<View style={{ position: 'absolute', bottom: 0, right: 0, left: 0, padding: 20 }}>
            <View>
                <Text style={styles.detailHeader}>LOCATION</Text>
                <Text style={styles.detailText}>31.41567,-7.32166</Text>
            </View>
            <View style={{ marginVertical: 5 }}>
                <Text style={styles.detailHeader}>SPECEIS</Text>
                <Text style={styles.detailText}>Sycamore maple</Text>
            </View>
            <View style={{ marginVertical: 5 }}>
                <Text style={styles.detailHeader}>DIAMETER</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FIcon name={'arrow-h'} style={styles.detailText} />
                    <Text style={styles.detailText}>10 cm</Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.detailHeader, { color: Colors.PRIMARY }]}>{'CAPTURED CO'}</Text>
                    </View>
                    <View style={{ justifyContent: 'flex-start' }}>
                        <Text style={{ fontSize: 10, color: Colors.PRIMARY }}>{'2'}</Text>
                    </View>
                </View>
                <Text style={[styles.detailText, { color: Colors.PRIMARY }]}>200 kg</Text>
            </View>
        </View>)
    }
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.container}>
                <Header headingText={'Tree Details'} />
                <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center' }}>
                    <View style={{ width: '100%', height: 350, borderWidth: 0, alignSelf: 'center', borderRadius: 15, overflow: 'hidden' }}>
                        <Image source={placeholder_image} style={{ width: '100%', height: '100%', }} />
                        <LinearGradient colors={['rgba(255,255,255,0)', '#707070']} style={{ position: 'absolute', width: '100%', height: '100%' }}>
                            {renderDetails()}
                        </LinearGradient>
                    </View>
                </ScrollView>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <PrimaryButton btnText={'Continue'} halfWidth theme={'white'} />
                    <PrimaryButton btnText={'Continue'} halfWidth />
                </View>
            </View>

        </SafeAreaView >
    )
}
export default SingleTreeOverview;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 25,
        backgroundColor: Colors.WHITE
    },
    detailHeader: {
        fontSize: Typography.FONT_SIZE_14,
        color: Colors.WHITE,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
    },
    detailText: {
        fontSize: Typography.FONT_SIZE_18,
        color: Colors.WHITE,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        lineHeight: Typography.LINE_HEIGHT_30,
    }
})