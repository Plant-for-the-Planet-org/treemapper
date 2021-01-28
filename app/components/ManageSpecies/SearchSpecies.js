import React from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Typography } from '_styles';
import Icon from 'react-native-vector-icons/Feather';

const SearchSpecies = ({ setSelectedSpecies, selectedSpecies, searchList, specieList }) => {

    const addSpecies = (item) => {
        setSelectedSpecies([...selectedSpecies, item]);
    };

    const removeSpecies = (item) => {
        setSelectedSpecies(
            selectedSpecies.filter((specie) => specie.scientific_name !== item.scientific_name),
        );
    };

    const checkIsSpeciePresent = (speciesList, specieToSearch) => {
        let isPresent = false;
        if (speciesList && speciesList.length > 0) {
            for (let specie of speciesList) {
                if (specie.scientific_name === specieToSearch.scientific_name) {
                    isPresent = true;
                    break;
                }
            }
        }
        return isPresent;
    };

    const renderSearchSpecieCard = ({ item, index }) => {
        let isDisabled = false;
        let isCheck = checkIsSpeciePresent(selectedSpecies, item);
        let isUserSpeciePresent = false;
        if (specieList && specieList.length > 0) {
            for (let specie of specieList) {
                if (specie.speciesId === item.guid) {
                    isUserSpeciePresent = true;
                    break;
                }
            }
        }
        if (isUserSpeciePresent) {
            isDisabled = true;
            isCheck = true;
        }

        const SpecieListItem = () => {
            return (
                <>
                    <View>
                        <Text
                            style={{
                                fontSize: Typography.FONT_SIZE_16,
                                fontFamily: Typography.FONT_FAMILY_REGULAR,
                            }}>
                            {item.scientific_name}
                        </Text>
                    </View>
                    <Icon
                        name={isCheck ? 'check-circle' : 'plus-circle'}
                        size={25}
                        color={isCheck ? Colors.PRIMARY : Colors.TEXT_COLOR}
                    />
                </>
            );
        };

        if (isDisabled) {
            return (
                <View style={[styles.specieListItem, { opacity: 0.5 }]}>
                    <SpecieListItem />
                </View>
            );
        } else {
            return (
                <TouchableOpacity
                    key={index}
                    style={styles.specieListItem}
                    onPress={() => {
                        if (isCheck) {
                            removeSpecies(item);
                        } else {
                            addSpecies(item);
                        }
                    }}>
                    <SpecieListItem />
                </TouchableOpacity>
            );
        }
    };


    const memoizedRenderSearchSpecieCard = React.useMemo(() => renderSearchSpecieCard, [selectedSpecies]);


    return (
        <View style={{ flex: 1, paddingTop: 15 }}>
            <FlatList
                style={{ flex: 1 }}
                data={searchList}
                showsVerticalScrollIndicator={false}
                keyExtractor={(item) => item.guid}
                renderItem={memoizedRenderSearchSpecieCard}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    specieListItem: {
        paddingVertical: 20,
        paddingRight: 10,
        borderBottomWidth: 1,
        borderColor: '#E1E0E061',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
});

export default SearchSpecies
