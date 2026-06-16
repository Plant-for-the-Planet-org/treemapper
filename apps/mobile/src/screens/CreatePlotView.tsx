import { Pressable, StyleSheet, View } from 'react-native'
import React, { useMemo, useState } from 'react'
import Header from 'src/components/common/Header'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from 'src/utils/constants'
import CreatePlotCard from 'src/components/monitoringPlot/CreatePlotCard'
import CustomButton from 'src/components/common/CustomButton'
import CustomDropDownPicker from 'src/components/common/CustomDropDown'
import { scaleSize } from 'src/utils/constants/mixins'
import InfoIcon from 'assets/images/svg/InfoIcon.svg'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'src/types/type/navigation.type'
import { useNavigation } from '@react-navigation/native'
import { useRealm } from '@realm/react'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import { RealmSchema } from 'src/types/enum/db.enum'
import { DropdownData, ProjectInterface } from 'src/types/interface/app.interface'
import useMonitoringPlotManagement from 'src/hooks/realm/useMonitoringPlotManagement'
import { newPlotDetails } from 'src/utils/helpers/monitoringPlotHelper/monitoringRealmHelper'
import { useToast } from 'react-native-toast-notifications'
import i18next from 'src/locales/index'

const CreatePlotView = () => {
    const [plotType, setPlotType] = useState<string>('INTERVENTION');
    const [plotShape, setPlotShape] = useState<string>('CIRCULAR');
    const [plotComplexity, setPlotComplexity] = useState<string>('STANDARD');

    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    const realm = useRealm()
    const { initializeNewPlot } = useMonitoringPlotManagement()
    const toast = useToast()

    // Projects the user can record into. Mirrors the project picker elsewhere:
    // donation/"funds" projects are excluded as you can't field-record into them.
    const projectData = useMemo(() => {
        const projects = realm.objects<ProjectInterface>(RealmSchema.Projects).filtered('purpose != "funds"')
        return projects.map((project, index) => ({
            label: project.name,
            value: project.id,
            index,
        }))
    }, [realm])

    // Pre-select the user's currently active project (if any) so the common case
    // is one tap. Selection is still required before continuing.
    const { currentProject } = useSelector((state: RootState) => state.projectState)
    const [selectedProject, setSelectedProject] = useState<DropdownData>(() => {
        const match = projectData.find(p => p.value === currentProject.projectId)
        return match || { label: '', value: '', index: 0 }
    })

    const handleNav = async () => {
        if (!selectedProject.value) {
            toast.show(i18next.t('label.select_project'))
            return
        }
        const details = newPlotDetails(
            plotShape === 'CIRCULAR' ? 'CIRCULAR' : 'RECTANGULAR',
            plotType === 'INTERVENTION' ? 'INTERVENTION' : 'CONTROL',
            plotComplexity === 'SIMPLE' ? 'SIMPLE' : 'STANDARD',
            { id: selectedProject.value, name: selectedProject.label },
        )
        const result = await initializeNewPlot(details)
        if (result) {
            navigation.replace('CreatePlotDetail', { id: details.plot_id })
        } else {
            toast.show("Error while creating plots")
        }
    }

    const openInfo = () => {
        navigation.navigate('MonitoringInfo')
    }

    return (
        <SafeAreaView style={styles.container}>
            <Header label={i18next.t('label.create_plot_header')} rightComponent={null} />
            <View style={styles.wrapper}>
                <CustomDropDownPicker
                    label={i18next.t('label.project')}
                    data={projectData}
                    onSelect={setSelectedProject}
                    selectedValue={selectedProject}
                />
                <CreatePlotCard header={'Plot Complexity'} labelOne={{
                    key: 'STANDARD',
                    value: i18next.t('label.standard')
                }} labelTwo={{
                    key: 'SIMPLE',
                    value: i18next.t('label.simple')
                }} disabled={true}
                    selectedValue={plotComplexity}
                    onSelect={setPlotComplexity}
                />
                <CreatePlotCard header={i18next.t('label.plot_shape')} labelOne={{
                    key: 'RECTANGULAR',
                    value: i18next.t('label.rectangular')
                }} labelTwo={{
                    key: 'CIRCULAR',
                    value: i18next.t('label.circular')
                }} disabled={false}
                    selectedValue={plotShape}
                    onSelect={setPlotShape} />
                <CreatePlotCard header={i18next.t('label.plot_type')} labelOne={{
                    key: 'INTERVENTION',
                    value: i18next.t('label.intervention')
                }} labelTwo={{
                    key: 'CONTROL',
                    value: i18next.t('label.control')
                }} disabled={false}
                    selectedValue={plotType}
                    onSelect={setPlotType} />
            </View>
            <CustomButton
                label={i18next.t('label.continue')}
                containerStyle={styles.btnContainer}
                pressHandler={handleNav}
                hideFadeIn
            />
        </SafeAreaView>
    )
}

export default CreatePlotView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE
    },
    wrapper: {
        flex: 1,
        backgroundColor: Colors.BACKDROP_COLOR
    },
    btnContainer: {
        width: '100%',
        height: scaleSize(70),
        position: 'absolute',
        bottom: 30,
    },
    infoWrapper: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: '5%'
    }
})
