import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Colors, Typography } from 'src/utils/constants'
import Header from 'src/components/common/Header'
import { SafeAreaView } from 'react-native-safe-area-context'
import CustomTextInput from 'src/components/common/CustomTextInput'
import Switch from 'src/components/common/Switch'
import CustomButton from 'src/components/common/CustomButton'
import { scaleSize } from 'src/utils/constants/mixins'
import { useToast } from 'react-native-toast-notifications'
import useMetaData from 'src/hooks/realm/useMetaData'
import { Metadata } from 'src/types/interface/app.interface'
import {v4 as uuid} from 'uuid'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'

const MetaDataElementView = () => {
    const [inputKey, setInputKey] = useState('')
    const [inputValue, setInputValue] = useState('')
    const [isPublic, setIsPublic] = useState(false)
    const [id, setId] = useState('')

    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const toast = useToast();
    const route = useRoute<RouteProp<RootStackParamList, 'MetaDataElement'>>()
    const realm = useRealm()

    const {addNewMetadata, updateMetaData, deleteMetaData} = useMetaData()
    const isEdit = route.params && route.params.edit
    const order = route.params?.order ?? 0;
    const elementId =  route.params && route.params.id? route.params.id: ''

    const renderRightElement=()=>{
        if(!isEdit){
            return null
        }
        return (
            <TouchableOpacity style={styles.deleteWrapper} onPress={handleDelete}>
                <Text style={styles.deletable}>Delete</Text>
            </TouchableOpacity>
        )
    }

    useEffect(() => {
        if(isEdit){
            const data = realm.objectForPrimaryKey<Metadata>(RealmSchema.Metadata,elementId);
            if(data){
              setInputKey(data.key)
              setInputValue(data.value)
              setIsPublic(data.accessType==='public');
              setId(data.id)
            }
        }
    }, [])
    


    const handleMetaData=async ()=>{
        if(isEdit){
            updateElement();
            return
        }
        try {
            if(inputKey===''){
                toast.show('Input key cannot be empty')
                return
            }
            if(inputValue===''){
                toast.show('Input value cannot be empty')
                return
            }
            const data: Metadata =  {
                id: uuid(),
                key: inputKey,
                value: inputValue,
                order: order,
                accessType: isPublic?'public':'private'
            }
            await addNewMetadata(data)
            navigation.goBack()
        } catch (error) {
            toast.show('Something went wrong')
        }
    }

    const updateElement=async ()=>{
        try {
            if(inputKey===''){
                toast.show('Input key cannot be empty')
                return
            }
            if(inputValue===''){
                toast.show('Input value cannot be empty')
                return
            }
            const data: Metadata =  {
                id: id,
                key: inputKey,
                value: inputValue,
                order: order,
                accessType: isPublic?'public':'private'
            }
            await updateMetaData(data)
            navigation.goBack()
        } catch (error) {
            toast.show('Something went wrong')
        }
    }

    const handleDelete=async()=>{
      await deleteMetaData(elementId)
      navigation.goBack()
    }

    return (
        <SafeAreaView style={styles.container}>
            <Header label={''} rightComponent={renderRightElement()}/>
            <Text style={styles.headerLabel}>Add metadata</Text>
            <CustomTextInput
                label="Field key"
                onChangeHandler={setInputKey}
                value={inputKey}
            />
            <CustomTextInput
                label="Field value"
                onChangeHandler={setInputValue}
                value={inputValue}
            />
            <View style={styles.switchContainer}>
                <Text style={styles.switchText}>Make this data public</Text>
                <Switch value={isPublic} onValueChange={() => {
                    setIsPublic(!isPublic)
                }} disabled={false} />
            </View>
            <CustomButton
                label={isEdit?"Update Element":"Add Element"}
                containerStyle={styles.btnContainer}
                pressHandler={handleMetaData}
            />
        </SafeAreaView>
    )
}

export default MetaDataElementView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE
    },
    headerLabel: {
        fontSize: 28,
        fontFamily: Typography.FONT_FAMILY_EXTRA_BOLD,
        color: Colors.DARK_TEXT_COLOR,
        marginLeft: 20,
        paddingBottom: 20
    },
    switchContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 20
    },
    switchText: {
        color: Colors.TEXT_COLOR,
        fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
        fontSize: Typography.FONT_SIZE_16,
        marginRight: 16,
    },
    btnContainer: {
        width: '100%',
        height: scaleSize(70),
        position: 'absolute',
        bottom: 20,
      },
      deleteWrapper:{
        alignItems:'center',
        justifyContent:'center',
        borderWidth:1,
        borderColor:'tomato',
        borderStyle: 'dashed',
        paddingHorizontal:20,
        paddingVertical:10,
        borderRadius:10,
        marginRight:10
      },
      deletable:{
        fontSize:16,
        fontFamily:Typography.FONT_FAMILY_SEMI_BOLD,
        color:'tomato',
        marginHorizontal:10,
      }
})