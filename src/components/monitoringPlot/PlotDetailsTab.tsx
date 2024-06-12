import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Typography, Colors } from 'src/utils/constants'


interface Props {
    changeIndex: (i: number) => void
    selectedIndex: number
}

const PlotDetailsTab = (props: Props) => {
    const { changeIndex, selectedIndex } = props
    return (
        <View style={styles.container}>
            <View style={styles.wrapper}>
                <Pressable style={styles.cardWrapper} onPress={() => {
                    changeIndex(0)
                }}>
                    <Text style={[styles.cardLabel, { color: selectedIndex === 0 ? Colors.NEW_PRIMARY : Colors.TEXT_COLOR }]}>
                        Plants
                    </Text>
                    {selectedIndex === 0 && <View style={styles.activeMarker}>
                        <Text style={styles.invisibleLabel}>
                            Plants
                        </Text>
                    </View>}
                </Pressable>
                <Pressable style={styles.cardWrapper} onPress={() => {
                    changeIndex(1)
                }}>
                    <Text style={[styles.cardLabel, { color: selectedIndex === 1 ? Colors.NEW_PRIMARY : Colors.TEXT_COLOR }]}>
                    Ecosystem
                    </Text>
                    {selectedIndex === 1 && <View style={styles.activeMarker}>
                        <Text style={styles.invisibleLabel}>
                            Ecosystem
                        </Text>
                    </View>}
                </Pressable>
                <Pressable style={styles.cardWrapper} onPress={() => {
                    changeIndex(2)
                }}>
                    <Text style={[styles.cardLabel, { color: selectedIndex === 2 ? Colors.NEW_PRIMARY : Colors.TEXT_COLOR }]}>
                    Map
                    </Text>
                    {selectedIndex === 2 && <View style={styles.activeMarker}>
                        <Text style={styles.invisibleLabel}>
                            Map
                        </Text>
                    </View>}
                </Pressable>
            </View>
        </View>
    )
}

export default PlotDetailsTab

const styles = StyleSheet.create({
    container: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.NEW_PRIMARY + '1A',
        paddingTop:10
    },
    wrapper: {
        width: '90%',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
    },
    cardWrapper: {
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: '2%',
        width: 100,
        paddingBottom:5
    },
    cardLabel: {
        fontSize: 15,
        fontFamily: Typography.FONT_FAMILY_BOLD,
        color: Colors.TEXT_COLOR,
        marginHorizontal: 5
    },
    invisibleLabel: {
        height: 0,
        lineHeight: 0,
        backgroundColor: 'red'
    },
    activeMarker: {
        height: 4,
        backgroundColor: Colors.NEW_PRIMARY,
        borderRadius: 10,
        paddingHorizontal: 10,
        position:'absolute',
        bottom:-1
    }
})