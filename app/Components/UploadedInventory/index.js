import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, ScrollView, ActivityIndicator, Image, Dimensions, Platform, Text } from 'react-native';
import { Header, SmallHeader, InventoryCard, PrimaryButton, AlertModal } from '../Common';
import { SafeAreaView } from 'react-native'
import { getAllUploadedInventory, clearAllIncompleteInventory, uploadInventory, clearAllUploadedInventory } from "../../Actions";
import { store } from '../../Actions/store';
import { Colors, Typography } from '_styles';
import { LocalInventoryActions } from '../../Actions/Action'
import { empty_inventory_banner } from "../../assets";
import { SvgXml } from "react-native-svg";
import moment from "moment";
import i18next from 'i18next';

const UploadedInventory = ({ navigation }) => {
    const { dispatch } = useContext(store)

    const [allInventory, setAllInventory] = useState(null)
    const [isShowFreeUpSpaceAlert, setIsShowFreeUpSpaceAlert] = useState(false)

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            initialState()
        });

        return unsubscribe;
    }, [navigation])

    const initialState = () => {
        getAllUploadedInventory().then((allInventory) => {
            setAllInventory(Object.values(allInventory))
        })
    }

    const onPressInventory = (item) => {
        setTimeout(() => {
            dispatch(LocalInventoryActions.setInventoryId(item.inventory_id))
            navigation.navigate(item.last_screen)
        }, 0)
    }

    const freeUpSpace = () => {
        clearAllUploadedInventory().then(() => {
            initialState()
            toogleIsShowFreeUpSpaceAlert()
        })
    }

    const toogleIsShowFreeUpSpaceAlert = () => {
        setIsShowFreeUpSpaceAlert(!isShowFreeUpSpaceAlert)
    }

    const renderInventoryList = (inventoryList) => {
        return (
            <FlatList
                showsVerticalScrollIndicator={false}
                data={inventoryList}
                renderItem={({ item }) => {
                    let imageURL;
                    if (item.polygons[0] && item.polygons[0].coordinates && Object.values(item.polygons[0].coordinates).length) {
                        imageURL = item.polygons[0].coordinates[0].imageUrl
                    }
                    let locateTreeAndType = '';
                    let title = '';
                    if (item.locate_tree = 'off-site') {
                        locateTreeAndType = 'Off Site'
                    } else {
                        locateTreeAndType = 'On Site'
                    }
                    if (item.tree_type == 'single') {
                        title = `1 ${item.specei_name ? `${item.specei_name} ` : ''}Tree`
                        locateTreeAndType += ' - Point'
                    } else {
                        let totalTreeCount = 0
                        let species = Object.values(item.species)

                        for (let i = 0; i < species.length; i++) {
                            const oneSpecies = species[i];
                            totalTreeCount += Number(oneSpecies.treeCount)
                        }
                        title = `${totalTreeCount} Trees`
                        locateTreeAndType += ' - Polygon'
                    }
                    let data = { title: title, subHeading: locateTreeAndType, date: moment(new Date(Number(item.plantation_date))).format('ll'), imageURL: imageURL }
                    return (<TouchableOpacity onPress={() => onPressInventory(item)}><InventoryCard icon={'cloud-check'} data={data} /></TouchableOpacity>)
                }}
            />
        )
    }

    const renderInventory = () => {
        return <View style={styles.cont}>
            {allInventory.length > 0 && <>
                <TouchableOpacity onPress={toogleIsShowFreeUpSpaceAlert}>
                    <Text style={styles.freeUpSpace}>Free Up Space</Text>
                </TouchableOpacity>
                {renderInventoryList(allInventory)}
            </>}
        </View>
    }

    const renderLoadingInventoryList = () => {
        return (<View style={styles.cont}>
            <Header headingText={i18next.t('label.tree_inventory_upload_list_header')} style={{ marginHorizontal: 25 }} />
            <ActivityIndicator size={25} color={Colors.PRIMARY} />
        </View>)
    }

    const renderEmptyInventoryList = () => {
        return (<View style={styles.cont}>
            <Header headingText={i18next.t('label.tree_inventory_upload_list_header')} style={{ marginHorizontal: 25 }} />
            <SvgXml xml={empty_inventory_banner} style={styles.emptyInventoryBanner} />
            <View style={styles.parimaryBtnCont}>
                <PrimaryButton onPress={() => navigation.navigate('TreeInventory')} btnText={i18next.t('label.tree_inventory_upload_empty_btn_text')} />
            </View>
        </View>)
    }

    const renderInventoryListContainer = () => {
        return (<View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} >
                <Header headingText={i18next.t('label.tree_inventory_upload_list_header')} />
                {renderInventory()}
            </ScrollView>
            <SafeAreaView />
        </View>)
    }

    return (
        <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
            <SafeAreaView />
            {allInventory && allInventory.length > 0 ? renderInventoryListContainer() : allInventory == null ? renderLoadingInventoryList() : renderEmptyInventoryList()}
            <AlertModal visible={isShowFreeUpSpaceAlert} heading={i18next.t('label.tree_inventory_alert_header')} message={i18next.t('label.tree_inventory_alert_sub_header')} primaryBtnText={i18next.t('label.tree_inventory_alert_primary_btn_text')} secondaryBtnText={i18next.t('label.alright_modal_white_btn')} onPressPrimaryBtn={freeUpSpace} onPressSecondaryBtn={toogleIsShowFreeUpSpaceAlert} />
        </View>
    )
}
export default UploadedInventory;

const styles = StyleSheet.create({

    container: {
        flex: 1,
        paddingHorizontal: 25,
        backgroundColor: Colors.WHITE
    },
    cont: {
        flex: 1
    },
    emptyInventoryBanner: {
        width: '109%', height: '80%', marginHorizontal: -5, bottom: -10
    },
    parimaryBtnCont: {
        position: 'absolute', width: '100%', justifyContent: 'center', bottom: 10, paddingHorizontal: 25
    },
    freeUpSpace: {
        color: Colors.PRIMARY,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        fontSize: Typography.FONT_SIZE_18,
        lineHeight: Typography.LINE_HEIGHT_30,
        textAlign: 'center',
        marginVertical: 10
    }
})
