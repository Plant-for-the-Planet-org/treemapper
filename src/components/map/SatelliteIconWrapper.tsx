import { Dimensions, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import SatelliteIcon from 'assets/images/svg/SatelliteIcon.svg'
import SatelliteIconOn from 'assets/images/svg/SatelliteIconOn.svg'

import { scaleSize } from 'src/utils/constants/mixins'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { updateMainMapView } from 'src/store/slice/displayMapSlice'
import { Colors } from 'src/utils/constants'

const windowWidth = Dimensions.get('window').width;

interface Props {
    low?: boolean
}

const SatelliteIconWrapper = (props: Props) => {
    const { low } = props
    const viewState = useSelector(
        (state: RootState) => state.displayMapState.mainMapView,
    )

    const dispatch = useDispatch()

    const handlePress = () => {
        dispatch(updateMainMapView(viewState === 'SATELLITE' ? 'VECTOR' : 'SATELLITE'))
    }

    return (
        <TouchableOpacity style={[styles.container, { bottom: low ? scaleSize(180) : scaleSize(220) }]} onPress={handlePress}>
            {viewState === 'SATELLITE' ? <SatelliteIconOn width={25} height={25} /> : <SatelliteIcon width={25} height={25} />}
        </TouchableOpacity>
    )
}

export default SatelliteIconWrapper

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        zIndex: 1,
        right: '9%',
        bottom: windowWidth / 2.5,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        borderRadius:12
    },
})
