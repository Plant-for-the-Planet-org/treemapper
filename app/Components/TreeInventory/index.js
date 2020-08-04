import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, ScrollView, ActivityIndicator, Image, Dimensions, Platform, Modal, Text } from 'react-native';
import { Header, SmallHeader, InventoryCard, PrimaryButton } from '../Common';
import { SafeAreaView } from 'react-native'
import { getAllInventory, clearAllInventory, uploadInventory, isLogin, auth0Login } from "../../Actions";
import { store } from '../../Actions/store';
import { Colors } from '_styles';
import { LocalInventoryActions } from '../../Actions/Action'
import { empty_inventory_banner } from "../../assets";
import { SvgXml } from "react-native-svg";
import moment from "moment";

const TreeInventory = ({ navigation }) => {
    const { dispatch } = useContext(store)

    const [allInventory, setAllInventory] = useState(null)
    const [isLoaderShow, setIsLoaderShow] = useState(false)

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            initialState()
        });

        return unsubscribe
    }, [navigation])

    const onPressInventory = (item) => {
        setTimeout(() => {
            dispatch(LocalInventoryActions.setInventoryId(item.inventory_id))
            navigation.navigate(item.last_screen)
        }, 0)
    }

    const initialState = () => {
        getAllInventory().then((allInventory) => {
            setAllInventory(Object.values(allInventory))
        })
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
                    return (<TouchableOpacity onPress={() => onPressInventory(item)} accessibilityLabel="Inventory List" accessible={true} testID="inventory_list"><InventoryCard icon={'cloud-outline'} data={data} /></TouchableOpacity>)
                }}
            />
        )
    }

    const onPressClearAll = () => {
        clearAllInventory().then(() => {
            getAllInventory().then((allInventory) => {
                setAllInventory(Object.values(allInventory))
            })
        })
    }

    let pendingInventory = []
    let inCompleteInventory = []
    let uploadedInventory = []
    if (allInventory) {
        pendingInventory = allInventory.filter(x => x.status == 'pending')
        inCompleteInventory = allInventory.filter(x => x.status == 'incomplete')
        uploadedInventory = allInventory.filter(x => x.status == 'complete')
    }

    const checkIsUserLogin = () => {
        return new Promise((resolve, reject) => {
            isLogin().then((isUserLogin) => {
                if (!isUserLogin) {
                    auth0Login().then((isUserLogin) => {
                        isUserLogin ? resolve() : reject()
                    }).catch((err) => {
                        alert(err.error_description)
                    })
                }
            })
        })
    }

    const onPressUploadNow = () => {
        checkIsUserLogin().then(() => {
            setIsLoaderShow(true)
            uploadInventory().then((data) => {
                initialState()
                setIsLoaderShow(false)
            }).catch((err) => {
                setIsLoaderShow(false)
            })

        })
    }

    const renderLoaderModal = () => {
        return (<Modal
            transparent
            visible={isLoaderShow}>
            <View style={styles.dowloadModalContainer}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ padding: 30, backgroundColor: '#fff', borderRadius: 10 }}>Uploading .......</Text>
                </View>
            </View>
        </Modal>)
    }

    const renderInventory = () => {
        return (<View style={styles.cont}>
            {pendingInventory.length > 0 && <><SmallHeader onPressRight={onPressUploadNow} leftText={'Pending Upload'} rightText={'Upload now'} icon={'cloud-upload'} style={{ marginVertical: 15 }} />
                {renderInventoryList(pendingInventory)}</>}
            {uploadedInventory.length > 0 && <PrimaryButton onPress={() => navigation.navigate('UploadedInventory')} btnText={'View all uploaded Items'} theme={'white'} style={{ marginVertical: 20 }} />}
            {inCompleteInventory.length > 0 && <><SmallHeader onPressRight={onPressClearAll} leftText={'Incomplete Registrations'} rightText={'Clear All'} rightTheme={'red'} style={{ marginVertical: 15 }} />
                {renderInventoryList(inCompleteInventory)}</>}
        </View>)
    }

    const renderLoadingInventoryList = () => {
        return (<View style={styles.cont}>
            <Header headingText={'Tree Inventory'} subHeadingText={'It’s empty in here, please register some trees to view them.'} style={{ marginHorizontal: 25 }} />
            <ActivityIndicator size={25} color={Colors.PRIMARY} />
        </View>)
    }

    const renderEmptyInventoryList = () => {
        return (<View style={styles.cont}>
            <Header headingText={'Tree Inventory'} subHeadingText={'It’s empty in here, please register some trees to view them.'} style={{ marginHorizontal: 25 }} />
            <SvgXml xml={empty_inventory_banner} style={styles.emptyInventoryBanner} />
            <View style={styles.parimaryBtnCont}>
                {uploadedInventory.length > 0 && <PrimaryButton onPress={() => navigation.navigate('UploadedInventory')} btnText={'View all uploaded Items'} theme={'white'} style={{ marginVertical: 20 }} />}
                <PrimaryButton onPress={() => navigation.navigate('RegisterTree')} btnText={'Register Tree'} />
            </View>
        </View>)
    }

    const renderInventoryListContainer = () => {
        return (<View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} >
                <Header headingText={'Tree Inventory'} subHeadingText={'Inventory will be cleared after upload is complete'} />
                {renderInventory()}
            </ScrollView>
            <PrimaryButton onPress={() => navigation.navigate('RegisterTree')} btnText={'Register Tree'} />
            <SafeAreaView />
        </View>)
    }

    return (
        <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
            <SafeAreaView />
            {allInventory && allInventory.length > 0 ? renderInventoryListContainer() : allInventory == null ? renderLoadingInventoryList() : renderEmptyInventoryList()}
            {renderLoaderModal()}
        </View>
    )
}
export default TreeInventory;

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
    dowloadModalContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)',
    },
    loader: {
        backgroundColor: Colors.WHITE, borderRadius: 20, marginVertical: 20
    },
})
