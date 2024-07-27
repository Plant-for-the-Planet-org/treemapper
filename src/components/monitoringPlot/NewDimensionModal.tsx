import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import Modal from 'react-native-modal'
import CustomTextInput from '../common/CustomTextInput'
import CustomButton from '../common/CustomButton'
import { scaleSize } from 'src/utils/constants/mixins'
import { validateNumber } from 'src/utils/helpers/formHelper/validationHelper'
import { useToast } from 'react-native-toast-notifications'
import { PLOT_SHAPE } from 'src/types/type/app.type'

interface Props {
    isVisible: boolean
    toogleModal: () => void
    updatedDimensions: (length: number, width: number, radius: number) => void
    initialValue: {
        h: string,
        w: string,
        r: string
    }
    shape: PLOT_SHAPE
}

const NewDimensionModal = (props: Props) => {
    const { isVisible, toogleModal, updatedDimensions, initialValue, shape } = props
    const [dimensionHeight, setDimensionHeight] = useState('')
    const [dimensionWidth, setDimensionWidth] = useState('')
    const [dimensionRadius, setDimensionRadius] = useState('')
    const toast = useToast()

    useEffect(() => {
        if (isVisible) {
            setDimensionHeight(initialValue.h)
            setDimensionWidth(initialValue.w)
            setDimensionRadius(initialValue.r)
        }
    }, [isVisible, shape])


    const handlePress = () => {
        if (shape === 'RECTANGULAR') {
            const validWidth = validateNumber(dimensionWidth, 'width', 'width')
            const validHeight = validateNumber(dimensionHeight, 'length', 'length')
            if (validHeight.hasError) {
                toast.show(validHeight.errorMessage)
                return
            }
            if (validWidth.hasError) {
                toast.show(validWidth.errorMessage)
                return
            }
        } else {
            const validRadius = validateNumber(dimensionRadius, 'Radius', 'Radius')
            if (!validRadius) {
                toast.show(validRadius.errorMessage)
                return
            }
            if (Number(dimensionRadius) < 25) {
                toast.show("Please add valid Radius as per note")
                return
            }
        }
        updatedDimensions(Number(dimensionHeight), Number(dimensionWidth), Number(dimensionRadius))
    }



    return (
        <Modal style={styles.container} isVisible={isVisible} onBackButtonPress={toogleModal} onBackdropPress={toogleModal}>
            <View style={styles.sectionWrapper}>
                <Text style={styles.header}>Update Dimensions</Text>
                {shape === "RECTANGULAR" ? <>
                    <CustomTextInput
                        label="Height"
                        onChangeHandler={setDimensionHeight}
                        value={dimensionHeight}
                    />
                    <CustomTextInput
                        label="Width"
                        onChangeHandler={setDimensionWidth}
                        value={dimensionWidth}
                    />
                </> :
                    <CustomTextInput
                        label="Radius"
                        onChangeHandler={setDimensionRadius}
                        value={dimensionRadius}
                    />}
                <CustomButton
                    label={"Continue"}
                    containerStyle={styles.btnContainer}
                    pressHandler={handlePress}
                    hideFadeIn
                />
            </View>
        </Modal>
    )
}

export default NewDimensionModal

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        margin: 0,
        padding: 0
    },
    sectionWrapper: {
        width: '90%',
        paddingVertical: 20,
        backgroundColor: Colors.WHITE,
        borderRadius: 8
    },
    header: {
        fontSize: 20,
        fontFamily: Typography.FONT_FAMILY_BOLD,
        color: Colors.TEXT_COLOR,
        marginLeft: 20,
        marginVertical: 10
    },
    btnContainer: {
        width: '100%',
        height: scaleSize(70),
        marginTop: 20
    },
    deleteBinWrapper: {
        width: 30,
        height: 30,
        position: 'absolute',
        top: 10,
        right: 10,
        justifyContent: "center",
        alignItems: "center"
    }
})