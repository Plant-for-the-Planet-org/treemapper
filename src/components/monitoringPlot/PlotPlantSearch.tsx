import { StyleSheet, TextInput, View } from 'react-native'
import React from 'react'
import SearchIcon from 'assets/images/svg/SearchIcon.svg'
import { Typography, Colors } from 'src/utils/constants'
import { scaleSize } from 'src/utils/constants/mixins'

interface Props{
    onChangeText:(t:string)=>void
}

const PlotPlantSearch = (props:Props) => {
    const {onChangeText} =props
    return (
        <View style={styles.container}>
            <View style={styles.searchWrapper}>
                <View style={styles.searchBar}>
                    <SearchIcon style={styles.searchIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder={'search'}
                        onChangeText={onChangeText}
                        underlineColorAndroid="transparent"
                    />
                </View>
            </View>
        </View>
    )
}

export default PlotPlantSearch

const styles = StyleSheet.create({
    container: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical:10,
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
    input: {
        flex:1,
        paddingTop: 10,
        paddingRight: 10,
        paddingBottom: 10,
        paddingLeft: 0,
        fontSize: 16, fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        color: Colors.TEXT_COLOR
    },
})