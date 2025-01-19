import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { scaleSize } from 'src/utils/constants/mixins'
import { BottomSheetBackdropProps, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { IScientificSpecies } from 'src/types/interface/app.interface'
import { useQuery, useRealm } from '@realm/react'
import { Colors, Typography } from 'src/utils/constants'
import { FlashList } from '@shopify/flash-list'
import CloseIcon from 'assets/images/svg/CloseIcon.svg'
import SearchIcon from 'assets/images/svg/SearchIcon.svg'
import { RealmSchema } from 'src/types/enum/db.enum'
import { SpecieCard } from '../species/ManageSpeciesCard'
import i18next from 'src/locales/index'

interface Props {
    isVisible: boolean
    toggleModal: () => void
    setSpecies: (i: IScientificSpecies) => void
}

const PlantPlotListModal = (props: Props) => {
    // ref
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    // variables
    const snapPoints = useMemo(() => ['70%'], []);

    const { isVisible, toggleModal, setSpecies } = props
    const [plantData, setPlantData] = useState<IScientificSpecies[]>([])
    const [search, setSearch] = useState('')
    const realm = useRealm()


    const userFavSpecies = useQuery<IScientificSpecies>(RealmSchema.ScientificSpecies, data => {
        return data.filtered('isUserSpecies == true')
    })

    useEffect(() => {
        if (isVisible) {
            bottomSheetModalRef.current?.present();
        } else {
            bottomSheetModalRef.current?.dismiss();
        }
    }, [isVisible])



    const handleItemSelection = (item: IScientificSpecies) => {
        toggleModal()
        setSpecies(item)
    }

    const querySearchResult = () => {
        const specieArray: IScientificSpecies[] = Array.from(
            realm
                .objects<IScientificSpecies>(RealmSchema.ScientificSpecies)
                .filtered('scientificName CONTAINS $0', search),
        )
        setPlantData(specieArray)
    }

    useEffect(() => {
        if (search.length === 0) {
            setPlantData([])
            return
        }
        querySearchResult()
    }, [search])

    const searchHandler = (t: string) => {
        setSearch(t)
    }

    const renderSpecieCard = (item: IScientificSpecies) => {
        return (
            <SpecieCard
                item={item}
                onPressSpecies={handleItemSelection}
                actionName={''}
                handleRemoveFavorite={() => { }}
                isSelectSpecies={true} />
        )
    }

    const closeModal = () => {
        bottomSheetModalRef.current.dismiss()
        toggleModal()
    }

    const backdropModal = ({ style }: BottomSheetBackdropProps) => (
        <Pressable style={[style, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} onPress={closeModal} />
    )

    const renderEmptyList = () => {
        return (<View style={styles.emptyWrapper}>
            <Text style={styles.emptyLabel}>
                {search.length === 3 ? i18next.t('No species found') : i18next.t('label.type_three_word')}
            </Text>
        </View>)
    }


    return (
        <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            handleIndicatorStyle={styles.handleIndicatorStyle}
            detached
            handleStyle={styles.handleIndicatorStyle} enableContentPanningGesture={false}
            snapPoints={snapPoints}
            backdropComponent={backdropModal}
        >
            <BottomSheetView style={styles.container} >
                <View style={styles.sectionWrapper}>
                    <View style={styles.headerWrapper}>
                        <Text style={styles.headerLabel}>
                            {i18next.t('label.select_species')}
                        </Text>
                        <CloseIcon width={18} height={18} onPress={toggleModal} />
                    </View>
                    <View style={styles.searchWrapper}>
                        <View style={styles.searchBar}>
                            <SearchIcon style={styles.searchIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder={'Search for species'}
                                value={search}
                                onChangeText={searchHandler}
                                underlineColorAndroid="transparent"
                            />
                        </View>
                    </View>
                    <View style={styles.contentWrapper}>
                        <FlashList
                            estimatedItemSize={100}
                            ListEmptyComponent={renderEmptyList}
                            data={search.length === 0 ? [...userFavSpecies] : [...plantData]}
                            renderItem={({ item }) => renderSpecieCard(item)}
                        />
                    </View>
                </View>
            </BottomSheetView>
        </BottomSheetModal>
    )
}

export default PlantPlotListModal

const styles = StyleSheet.create({
    container: {
        flex: 1,
        margin: 0,
    },
    sectionWrapper: {
        width: '100%',
        backgroundColor: Colors.WHITE,
        alignItems: 'center',
        flex: 1
    },
    headerWrapper: {
        height: 50,
        width: '100%',
        paddingHorizontal: '5%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    searchWrapper: {
        height: 50,
        width: '100%',
        paddingHorizontal: '5%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
        marginBottom: 10
    },
    searchInputWrapper: {
        height: 50,
        width: '100%',
        paddingHorizontal: '5%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerLabel: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_BOLD,
        color: Colors.DARK_TEXT
    },
    contentWrapper: {
        width: '100%',
        borderRadius: 30,
        flex: 1,
    },
    handleIndicatorStyle: {
        backgroundColor: Colors.WHITE,
        borderRadius: 30
    },
    searchBar: {
        width: '95%',
        flexDirection: 'row',
        alignItems: 'center',
        height: scaleSize(45),
        borderRadius: 100,
        backgroundColor: Colors.WHITE,
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.09,
        shadowRadius: 3.3,
        elevation: 1,
    },
    searchIcon: {
        paddingLeft: scaleSize(50),
    },
    searchText: {
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        fontWeight: Typography.FONT_WEIGHT_MEDIUM,
        fontSize: Typography.FONT_SIZE_14,
        paddingLeft: '1%',
        flex: 1,
        color: Colors.PLANET_BLACK,
    },
    emptyWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
        paddingHorizontal: 50
    },
    emptyLabel: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_COLOR,
        textAlign: 'center'
    },
    input: {
        flex: 1,
        paddingTop: 10,
        paddingRight: 10,
        paddingBottom: 10,
        paddingLeft: 0,
        backgroundColor: '#fff',
        fontSize: 16, fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR
    },
})
