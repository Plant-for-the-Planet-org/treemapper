import { StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import SatteliteIcon from 'assets/images/svg/SatteliteIcon.svg'
import SatteliteIconOn from 'assets/images/svg/SatteliteIconOn.svg'

import { scaleSize } from 'src/utils/constants/mixins'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { updateMainMapView } from 'src/store/slice/displayMapSlice'


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
        <TouchableOpacity style={[styles.container,{bottom:low?scaleSize(180):scaleSize(220)}]} onPress={handlePress}>
            {viewState === 'SATELLITE' ? <SatteliteIconOn width={25} height={25} /> : <SatteliteIcon width={25} height={25} />}
        </TouchableOpacity>
    )
}

export default SatelliteIconWrapper

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        zIndex: 1,
        right: '8.5%',
        bottom: scaleSize(220),
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 8
    },
})
