import { StyleSheet, View } from 'react-native'
import React from 'react'
import { Colors, Typography } from 'src/utils/constants'
import { FormElement } from 'src/types/interface/form.interface'
import DropdownComponent from '../common/CustomDropDown'
import { DropdownData } from 'src/types/interface/app.interface'

interface Props {
    data: FormElement
    formValues: { [key: string]: any }
    changeHandler: (key: string, value: string) => void
}

const DropDownFormElement = (props: Props) => {
    const { data, formValues, changeHandler } = props
    const dropDownOption = JSON.parse(data.dropDownData)
    const tranformData = dropDownOption.map((el, i) => {
        return {
            label: el.key,
            value: el.value,
            index: i
        }
    })

    const handleSelection = (d: DropdownData) => {
        changeHandler(data.key, JSON.stringify(d))
    }


    return (
        <View style={styles.container}>
            <View style={styles.wrapper}>
                <DropdownComponent label={data.label} data={tranformData} onSelect={handleSelection} selectedValue={formValues[data.key].value ? JSON.parse(formValues[data.key].value) : tranformData[0]} />
            </View>
        </View>
    )
}

export default DropDownFormElement

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginTop: 10,
        marginBottom: 15,
        justifyContent: 'center',
        alignItems: 'center'
    },
    wrapper: {
        width: '95%',
    },
    label: {
        fontSize: 22,
        fontFamily: Typography.FONT_FAMILY_BOLD,
        color: Colors.TEXT_COLOR
    }
})