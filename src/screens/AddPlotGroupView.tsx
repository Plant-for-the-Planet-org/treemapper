import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from 'src/components/common/Header'
import { Colors, Typography } from 'src/utils/constants'
import OutlinedTextInput from 'src/components/common/OutlinedTextInput'
import CustomButton from 'src/components/common/CustomButton'
import { scaleSize, scaleFont } from 'src/utils/constants/mixins'
import { StackNavigationProp } from '@react-navigation/stack'
import useMonitoringPlotManagement from 'src/hooks/realm/useMonitoringPlotManagement'
import { PlotGroups } from 'src/types/interface/slice.interface'
import { useToast } from 'react-native-toast-notifications'
import { generateUniquePlotId } from 'src/utils/helpers/monitoringPlotHelper/monitoringRealmHelper'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import GroupListPlot from 'src/components/monitoringPlot/GroupListPlot'
import i18next from 'src/locales/index'


const AddPlotGroup = () => {
    const route = useRoute<RouteProp<RootStackParamList, 'AddPlotGroup'>>()
    const isEdit = route.params?.isEdit ?? '';
    const groupId = route.params?.groupId ?? '';

    const [groupName, setGroupName] = useState('')
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const [isEditable, setIsEditable] = useState(false)
    const [gID, setGID] = useState('')
    const realm = useRealm()
    const { createNewPlotGroup, editGroupName } = useMonitoringPlotManagement()
    const toast = useToast()
    useEffect(() => {
        if (isEdit) {
            setGID(groupId)
            setIsEditable(true)
            loadGroupData()
        }
    }, [isEdit, groupId])


    const loadGroupData = () => {
        const detail = realm.objectForPrimaryKey<PlotGroups>(RealmSchema.PlotGroups, groupId);
        if (detail) {
            setGroupName(detail.name)
        }
    }

    const continuePress = async () => {
        if (!isEditable) {
            const newGroupId = generateUniquePlotId()
            const groupDetails: PlotGroups = {
                name: groupName,
                group_id: newGroupId,
                date_created: Date.now(),
                details_updated_at: Date.now(),
                plots: []
            }
            const result = await createNewPlotGroup(groupDetails)
            if (result) {
                setIsEditable(true)
                setGID(newGroupId)
            } else {
                toast.show("Something went wrong while creating Group")
            }
        } else {
            addPlotPress()
        }
    }

    const addPlotPress = () => {
        navigation.navigate('AddPlotsToGroup', { groupId: gID })
    }

    const handleGroupName = (t: string) => {
        setGroupName(t)
        if (isEditable) {
            editGroupName(gID, t)
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <Header label={isEditable ? i18next.t('label.edit_group_header') : i18next.t('label.create_group_header')} />
            <View style={styles.inputWrapper}>
                <OutlinedTextInput
                    placeholder={i18next.t('label.group_name')}
                    changeHandler={handleGroupName}
                    keyboardType={'default'}
                    autoFocus
                    defaultValue={groupName}
                    trailingText={''} errMsg={''} />
            </View>
            {gID && <GroupListPlot gid={gID} />}
            {!isEditable && <View style={styles.emptyWrapper}>
                <Text style={styles.emptyLabel}>
                    {i18next.t('label.create_group_note')}
                </Text>
            </View>}
            <CustomButton
                label={isEditable ? i18next.t('label.add_plot') : i18next.t('label.create_group')}
                containerStyle={styles.btnContainer}
                pressHandler={continuePress}
                disable={groupName.trim() === ''}
                hideFadeIn
                showAdd
            />
        </SafeAreaView>
    )
}

export default AddPlotGroup

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE,
        alignItems: 'center'
    },
    wrapper: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
    },
    inputWrapper: {
        width: '95%'
    },
    btnContainer: {
        width: '100%',
        height: scaleSize(70),
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        bottom: 30,
    },
    btnWrapper: {
        flex: 1,
        width: '90%',
    },
    imageContainer: {
        width: '100%',
        height: '100%',
    },
    borderWrapper: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 5,
        width: '90%',
        height: '80%',
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.PRIMARY_DARK,
    },
    noBorderWrapper: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 5,
        width: '90%',
        height: '80%',
        backgroundColor: Colors.PRIMARY_DARK,
        borderRadius: 12,
    },
    opaqueWrapper: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 5,
        width: '90%',
        height: '70%',
        backgroundColor: Colors.PRIMARY_DARK,
        borderRadius: 10,
    },
    highlightLabel: {
        fontSize: scaleFont(16),
        fontWeight: '400',
        color: Colors.PRIMARY_DARK,
    },
    normalLabel: {
        fontSize: scaleFont(14),
        fontWeight: '400',
        color: Colors.WHITE,
        textAlign: 'center',
    },
    sectionWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyWrapper: {
        flex: 1,
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    emptyLabel: {
        fontSize: 16,
        fontFamily: Typography.FONT_FAMILY_REGULAR,
        color: Colors.TEXT_LIGHT,
        width: '100%',
        textAlign: 'center',
        letterSpacing: 0.5,
        marginTop: 100
    }

})

