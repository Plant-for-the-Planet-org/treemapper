import { StyleSheet, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
import Header from 'src/components/common/Header'
import { useRealm } from '@realm/react'
import { RealmSchema } from 'src/types/enum/db.enum'
import { DropdownData, ProjectInterface } from 'src/types/interface/app.interface'
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native'
import { RootStackParamList } from 'src/types/type/navigation.type'
import CustomDropDown from 'src/components/common/CustomDropDown'
import i18next from 'i18next'
import CustomButton from 'src/components/common/CustomButton'
import useInterventionManagement from 'src/hooks/realm/useInterventionManagement'
import { useToast } from 'react-native-toast-notifications'
import { StackNavigationProp } from '@react-navigation/stack'

const EditProjectView = () => {
    const realm = useRealm()
    const { updateInterventionProjectAndSite } = useInterventionManagement()
    const [allProjects, setAllProjects] = useState<DropdownData[]>([])
    const [siteData, setSiteData] = useState<DropdownData[]>([])
    const [selectedProject, setSelectedProject] = useState({
        label: '',
        value: '',
        index: 0
    })
    const [selectedSite, setSelectedSite] = useState({
        label: '',
        value: '',
        index: 0
    })

    const toast = useToast()

    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const route = useRoute<RouteProp<RootStackParamList, 'EditProject'>>()
    const interventionId = route.params ? route.params.interventionId : ''
    const projectId = route.params ? route.params.projectId : ''
    const siteId = route.params ? route.params.siteId : ''


    useEffect(() => {
        setupProjectAndSiteDropDown()
    }, [])


    const setupProjectAndSiteDropDown = () => {
        const projectData = realm.objects<ProjectInterface>(RealmSchema.Projects)
        const mappedData = projectData.map((el, i) => {
            return {
                label: el.name,
                value: el.id,
                index: i,
            }
        })
        if (mappedData?.length) {
            setAllProjects(mappedData)
            const siteMappedData = projectData[0].sites.map((el, i) => {
                return {
                    label: el.name,
                    value: el.id,
                    index: i,
                }
            })
            setSiteData(siteMappedData)
            if (projectId) {
                const projectExist = mappedData.find(el => el.value === projectId)
                if (projectExist) {
                    handleProjectSelect({ label: projectExist.label, value: projectExist.value, index: 0 })
                }
            }
        }
    }

    const handleProjectSelect = (item: DropdownData) => {
        setSelectedProject({
            label: item.label,
            value: item.value,
            index: 0
        })
        const ProjectData = realm.objectForPrimaryKey<ProjectInterface>(
            RealmSchema.Projects,
            item.value,
        )
        const siteValidate = ProjectData.sites.map((el, i) => {
            return {
                label: el.name,
                value: el.id,
                index: i,
            }
        })
        if (siteValidate && siteValidate.length > 0) {
            setSiteData([...siteValidate, {
                label: 'Other',
                value: 'other',
                index: 0,
            },])
            if (siteId) {
                const siteExist = siteData.find(el => el.value === siteId)
                if (siteExist) {
                    setSelectedSite({
                        label: siteExist.label,
                        value: siteExist.value,
                        index: 0
                    })
                }
            }
        } else {
            setSiteData([
                {
                    label: 'Project has no site',
                    value: 'other',
                    index: 0,
                },
                {
                    label: 'Other',
                    value: 'other',
                    index: 0,
                },
            ])
        }
    }

    const handleSiteSelect = (item: DropdownData) => {
        if (item.value) {
            setSelectedSite({
                label: item.label,
                value: item.value,
                index: 0
            })
        }
    }

    const handleSubmission = async () => {
        if (selectedProject.value === '') {
            toast.show("Please select project")
            return;
        }
        await updateInterventionProjectAndSite(interventionId, selectedProject, selectedSite)
        toast.show("Project data updated")
        navigation.goBack()
    }

    return (
        <SafeAreaView style={styles.container}>
            <Header label='Back' />
            <View style={styles.wrapper}>
                <CustomDropDown
                    label={i18next.t('label.project')}
                    data={allProjects}
                    onSelect={handleProjectSelect}
                    selectedValue={selectedProject}
                />

                <CustomDropDown
                    label={i18next.t('label.site')}
                    data={siteData}
                    onSelect={handleSiteSelect}
                    selectedValue={selectedSite}
                />
                <CustomButton
                    label={'Save'}
                    pressHandler={handleSubmission}
                    containerStyle={styles.btnContainer}
                    wrapperStyle={styles.btnWrapper}
                    disable={false}
                    hideFadeIn
                />
            </View>
        </SafeAreaView>
    )
}

export default EditProjectView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE
    },
    wrapper: {
        flex: 1, backgroundColor: Colors.BACKDROP_COLOR
    },
    btnContainer: {
        width: '100%',
        height: 80,
        bottom: 20,
        marginBottom: 20,
        position: 'absolute',
    },
    btnWrapper: {
        width: '90%',
    },
})