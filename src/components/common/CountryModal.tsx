import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Platform,
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons'
import { Typography, Colors } from 'src/utils/constants'
import CountryData from 'src/utils/constants/countryData.json';
import i18next from 'i18next';
import { CountryCode } from 'src/types/interface/slice.interface';


const cdnUrl = process.env.EXPO_PUBLIC_CDN_URL
const protocol = process.env.EXPO_PUBLIC_API_PROTOCOL


interface Props {
    readonly visible: boolean
    readonly openModal: (b: boolean) => void
    readonly userCountry: (e: CountryCode) => void
}


const Item = ({ title, onPress }: { title: CountryCode, onPress: () => void }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
        <View style={{ flexDirection: 'row' }}>
            <Image
                source={{
                    uri: cdnUrl ? `${protocol}://${cdnUrl}/media/images/flags/png/256/${title.countryCode}.png` : null,
                }}
                style={styles.countryFlag}
                resizeMode="contain"
            />
            <View style={{ paddingLeft: 20 }}>
                <Text style={{ color: 'black', paddingTop: 12 }}>{title.countryName}</Text>
            </View>
        </View>
    </TouchableOpacity>
);

export default function CountryModal(props: Props) {
    const { visible, openModal, userCountry } = props

    const [countryData, setCountryData] = useState(null);

    const renderItem = ({ item }: { item: CountryCode }) => {
        return <Item title={item} onPress={() => selectCountry(item)} />;
    };
    const selectCountry = (data: CountryCode) => {
        userCountry(data);
    };
 
    const sort = () => {
        CountryData.sort((a, b) => {
            if (a.countryName > b.countryName) {
                return 1;
            }
            if (b.countryName > a.countryName) {
                return -1;
            }
            return 0;
        });
        setCountryData(CountryData);
    };

    useEffect(() => {
        sort();
        return sort();
    }, []);



    const modalOpen = () => {
        openModal(false);
    };


    return (
        <View style={styles.centeredView}>
            <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={() => { }}>
                <View style={styles.centeredView}>
                    <View style={styles.container}>
                        <TouchableOpacity style={{ paddingTop: Platform.OS === 'ios' ? 14 : null }}>
                            <Ionicons
                                name="arrow-back"
                                size={30}
                                color={Colors.TEXT_COLOR}
                                style={styles.iconStyle}
                                onPress={modalOpen}
                            />
                        </TouchableOpacity>
                        <View />
                    </View>
                    <View style={{ paddingLeft: 10, }}>
                        <Text style={styles.headerText}>{i18next.t('label.select_country')}</Text>
                    </View>
                    <View style={styles.modalView}>
                        <View style={styles.itemContainer}>
                            <FlatList
                                data={countryData}
                                renderItem={renderItem}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        backgroundColor: 'white',
        height: '100%',
    },
    modalView: {
        backgroundColor: 'white',
        color: 'black',
    },
    iconStyle: {
        paddingTop: 10,
    },
    item: {
        padding: 4,
        marginVertical: 0,
        marginHorizontal: 16,
    },
    itemContainer: {
        backgroundColor: 'white',
        paddingBottom: 160,
    },
    countryFlag: {
        height: 40,
        width: 40,
        borderRadius: 0,
    },
    headerText: {
        fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
        fontSize: Typography.FONT_SIZE_27,
        lineHeight: Typography.LINE_HEIGHT_40,
        color: Colors.TEXT_COLOR,
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 10,
        paddingTop: Platform.OS === 'ios' ? 20 : 14,
    },
});
