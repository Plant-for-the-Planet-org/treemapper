import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import SearchIcon from 'assets/images/svg/SearchIcon.svg'
import { Typography, Colors } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins'

const PlotPlantSearch = () => {
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.searchBar} onPress={() => null}>
                <SearchIcon style={styles.searchIcon} width={20} height={20} />
                <Text style={[styles.searchText, { color: Colors.GRAY_LIGHTEST }]}>
                   Search
                </Text>
            </TouchableOpacity>
        </View>
    )
}

export default PlotPlantSearch

const styles = StyleSheet.create({
    container: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor:Colors.BACKDROP_COLOR,
        paddingVertical:30,
    },
    searchBar: {
        width:'90%',
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
})