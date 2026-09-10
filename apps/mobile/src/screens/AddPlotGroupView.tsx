import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import { useSelector } from 'react-redux'
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
import GroupListPlot from 'src/components/monitoringPlot/GroupPlist'
import CustomDropDownPicker from 'src/components/common/CustomDropDown'
import { DropdownData, ProjectInterface } from 'src/types/interface/app.interface'
import { RootState } from 'src/store'
import i18next from 'src/locales/index'


const AddPlotGroup = () => {
    const route = useRoute<RouteProp<RootStackParamList, 'AddPlotGroup'>>()
    const isEdit = route.params?.isEdit ?? '';
    const groupId = route.params?.groupId ?? '';

    const [groupName, setGroupName] = useState('')
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const [isEditable, setIsEditable] = useState(false)
    const [gID, setGID] = useState('')
    const [saving, setSaving] = useState(false)
    const realm = useRealm()
    const { createNewPlotGroup, editGroupName } = useMonitoringPlotManagement()
    const toast = useToast()

    // A group belongs to one project, because the server's group routes are
    // project-scoped. Same picker and same exclusion as creating a plot.
    const projectData = useMemo(() => {
        const projects = realm.objects<ProjectInterface>(RealmSchema.Projects).filtered('purpose != "funds"')
        return projects.map((project, index) => ({
            label: project.name,
            value: project.id,
            index,
        }))
    }, [realm])

    const { currentProject } = useSelector((state: RootState) => state.projectState)
    const [selectedProject, setSelectedProject] = useState<DropdownData>(() => {
        const match = projectData.find(p => p.value === currentProject.projectId)
        return match || { label: '', value: '', index: 0 }
    })

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

    // One message per failure reason, so the user knows whether to find a signal
    // or to try again.
    const reportFailure = (reason?: 'offline' | 'server' | 'local') => {
        if (reason === 'offline') {
            toast.show(i18next.t('label.group_needs_internet'), { textStyle: { textAlign: 'center' } })
            return
        }
        toast.show(i18next.t('label.group_save_failed'))
    }

    const continuePress = async () => {
        if (saving) return
        if (!isEditable) {
            if (!selectedProject.value) {
                toast.show(i18next.t('label.select_project'))
                return
            }
            const newGroupId = generateUniquePlotId()
            const groupDetails: PlotGroups = {
                name: groupName.trim(),
                group_id: newGroupId,
                date_created: Date.now(),
                details_updated_at: Date.now(),
                plots: [],
                project_id: selectedProject.value,
                project_name: selectedProject.label,
                sync_status: 'SYNCED',
            }
            setSaving(true)
            const result = await createNewPlotGroup(groupDetails)
            setSaving(false)
            if (result.ok) {
                setIsEditable(true)
                setGID(newGroupId)
            } else {
                reportFailure(result.reason)
            }
        } else {
            await addPlotPress()
        }
    }

    // The name is saved when the user moves on, not on every keystroke: a rename
    // is a server call now, and one per character would be both slow and wrong.
    const addPlotPress = async () => {
        setSaving(true)
        const result = await editGroupName(gID, groupName.trim())
        setSaving(false)
        if (!result.ok) {
            reportFailure(result.reason)
            return
        }
        navigation.navigate('AddPlotsToGroup', { groupId: gID })
    }

    const handleGroupName = (t: string) => {
        setGroupName(t)
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
                {!isEditable && (
                    <CustomDropDownPicker
                        label={i18next.t('label.project')}
                        data={projectData}
                        onSelect={setSelectedProject}
                        selectedValue={selectedProject}
                    />
                )}
            </View>
            {!!gID && <GroupListPlot gid={gID} />}
            {!isEditable && <View style={styles.emptyWrapper}>
                <Text style={styles.emptyLabel}>
                    {i18next.t('label.create_group_note')}
                </Text>
            </View>}
            <CustomButton
                label={isEditable ? i18next.t('label.add_plot') : i18next.t('label.create_group')}
                containerStyle={styles.btnContainer}
                pressHandler={continuePress}
                disable={groupName.trim() === '' || saving}
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

