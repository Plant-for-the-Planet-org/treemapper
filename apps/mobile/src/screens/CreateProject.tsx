import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import { createMobileProject } from 'src/api/api.fetch';
import useProjectManagement from 'src/hooks/realm/useProjectManagement';
import { updateProjectState } from 'src/store/slice/projectStateSlice';
import { useDispatch } from 'react-redux';
import { useToast } from 'react-native-toast-notifications';
import { useNavigation } from '@react-navigation/native';
import { updateRefetchProject } from 'src/store/slice/appStateSlice';

const CreateProjectScreen = () => {
    const [workspace, setWorkspace] = useState('');
    const [projectName, setProjectName] = useState('');
    const [projectType, setProjectType] = useState('');
    const [target, setTarget] = useState('');
    const toast = useToast()
    const dispatch = useDispatch()
    const onBack = () => {
        navigation.goBack()

    }

    const onCreateProject = () => {

    }
    const navigation = useNavigation()
    // Dropdown states
    const [workspaceOpen, setWorkspaceOpen] = useState(false);
    const [projectTypeOpen, setProjectTypeOpen] = useState(false);

    // Loading and validation states
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [isFormValid, setIsFormValid] = useState(false);

    // Dropdown options
    const workspaceItems = [
        { label: 'Platform', value: 'platform-projects' },
        { label: 'Private', value: 'private-projects' },
        { label: 'Development', value: 'public-projects' },
    ];

    const projectTypeItems = [
        { label: 'Personal', value: 'personal' },
        { label: 'Conservation', value: 'conservation' },
        { label: 'Restoration', value: 'restoration' },
        { label: 'Other', value: 'other' },
    ];

    // Validation function
    const validateForm = () => {
        const newErrors = {};

        if (!workspace) {
            newErrors.workspace = 'Please select a workspace';
        }

        if (!projectName.trim()) {
            newErrors.projectName = 'Project name is required';
        } else if (projectName.trim().length < 3) {
            newErrors.projectName = 'Project name must be at least 3 characters';
        } else if (projectName.trim().length > 50) {
            newErrors.projectName = 'Project name must not exceed 50 characters';
        }

        if (!projectType) {
            newErrors.projectType = 'Please select a project type';
        }

        // Target is optional, but if provided, validate it's a positive number
        if (target && (!Number.isInteger(Number(target)) || Number(target) <= 0)) {
            newErrors.target = 'Target must be a positive number';
        }

        setErrors(newErrors);
        const isValid = Object.keys(newErrors).length === 0;
        setIsFormValid(isValid);
        return isValid;
    };

    // Validate form whenever inputs change
    useEffect(() => {
        validateForm();
    }, [workspace, projectName, projectType, target]);

    // Handle form submission
    const handleCreateProject = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            let projectData: any = {
                workspaceType: workspace,
                name: projectName.trim(),
                projectType,
            };

            if (target.length > 0 && Number(target)) {
                projectData["target"] = Number(target)
            }


            // API call placeholder
            console.log('Creating project with data:', projectData);

            // Simulate API call
            const { response } = await createMobileProject(projectData)
            console.log("SDC",response)
            if (response.code=='success') {
                dispatch(updateProjectState(true))
                setWorkspace('');
                setProjectName('');
                setProjectType('');
                setTarget('');
                setErrors({});
                toast.show("Projet created successfully.")
                dispatch(updateRefetchProject())
                navigation.goBack()
            } else {
                toast.show("There was error creating project. If the issue persist please contact help support.")
            }

        } catch (error) {
            toast.show("There was error creating project. If the issue persist please contact help support.")
        } finally {
            setIsLoading(false);
        }
    };

    // Close dropdowns when one opens
    const handleWorkspaceOpen = (open) => {
        setWorkspaceOpen(open);
        if (open) setProjectTypeOpen(false);
    };

    const handleProjectTypeOpen = (open) => {
        setProjectTypeOpen(open);
        if (open) setWorkspaceOpen(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onBack}
                        disabled={isLoading}
                    >
                        <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Create Project</Text>
                    <View style={styles.headerRight} />
                </View>

                {/* Form Content */}
                <View
                    style={styles.scrollContainer}
                >
                    {/* Workspace Dropdown */}
                    <View style={[styles.fieldContainer, { zIndex: 100 }]}>
                        <Text style={styles.label}>
                            Workspace <Text style={styles.required}>*</Text>
                        </Text>
                        <View style={[styles.dropdownContainer, errors.workspace && styles.errorBorder]}>
                            <DropDownPicker
                                open={workspaceOpen}
                                value={workspace}
                                items={workspaceItems}
                                setOpen={handleWorkspaceOpen}
                                setValue={setWorkspace}
                                placeholder="Select workspace"
                                style={styles.dropdown}
                                dropDownContainerStyle={styles.dropdownList}
                                textStyle={styles.dropdownText}
                                placeholderStyle={styles.placeholderText}
                                arrowIconStyle={styles.arrowIcon}
                                tickIconStyle={styles.tickIcon}
                                zIndex={3000}
                                zIndexInverse={1000}
                            />
                        </View>
                        {errors.workspace && <Text style={styles.errorText}>{errors.workspace}</Text>}
                    </View>

                    {/* Project Name Input */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>
                            Project Name <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={[styles.textInput, errors.projectName && styles.errorBorder]}
                            placeholder="Enter project name"
                            placeholderTextColor="#999"
                            value={projectName}
                            onChangeText={setProjectName}
                            maxLength={50}
                            editable={!isLoading}
                        />
                        {errors.projectName && <Text style={styles.errorText}>{errors.projectName}</Text>}
                    </View>

                    {/* Project Type Dropdown */}
                    <View style={[styles.fieldContainer, { zIndex: 100 }]}>
                        <Text style={styles.label}>
                            Project Type <Text style={styles.required}>*</Text>
                        </Text>
                        <View style={[styles.dropdownContainer, errors.projectType && styles.errorBorder]}>
                            <DropDownPicker
                                open={projectTypeOpen}
                                value={projectType}
                                items={projectTypeItems}
                                setOpen={handleProjectTypeOpen}
                                setValue={setProjectType}
                                placeholder="Select project type"
                                style={styles.dropdown}
                                dropDownContainerStyle={styles.dropdownList}
                                textStyle={styles.dropdownText}
                                placeholderStyle={styles.placeholderText}
                                arrowIconStyle={styles.arrowIcon}
                                tickIconStyle={styles.tickIcon}
                                zIndex={2000}
                                zIndexInverse={2000}
                            />
                        </View>
                        {errors.projectType && <Text style={styles.errorText}>{errors.projectType}</Text>}
                    </View>

                    {/* Target Input (Optional) */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Target</Text>
                        <TextInput
                            style={[styles.textInput, errors.target && styles.errorBorder]}
                            placeholder="Enter target number (optional)"
                            placeholderTextColor="#999"
                            value={target}
                            onChangeText={setTarget}
                            keyboardType="numeric"
                            editable={!isLoading}
                            returnKeyType={'done'}
                        />
                        {errors.target && <Text style={styles.errorText}>{errors.target}</Text>}
                    </View>

                    {/* Spacer for sticky footer */}
                    <View style={styles.spacer} />
                </View>

                {/* Sticky Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.createButton,
                            (!isFormValid || isLoading) && styles.createButtonDisabled
                        ]}
                        onPress={handleCreateProject}
                        disabled={!isFormValid || isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <Ionicons name="sync-outline" size={20} color="#FFFFFF" style={styles.loadingIcon} />
                                <Text style={styles.createButtonText}>Creating Project...</Text>
                            </View>
                        ) : (
                            <View style={styles.buttonContent}>
                                <Ionicons name="add-outline" size={22} color="#FFFFFF" />
                                <Text style={styles.createButtonText}>Create Project</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    keyboardAvoid: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8F8F8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        textAlign: 'center',
    },
    headerRight: {
        width: 40,
    },
    scrollContainer: {
        flex: 1,
        padding: 20
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 100, // Space for sticky footer
    },
    fieldContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    required: {
        color: '#FF4444',
    },
    dropdownContainer: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        zIndex: 100
    },
    dropdown: {
        backgroundColor: '#FFFFFF',
        borderWidth: 0,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 52,
    },
    dropdownList: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        marginTop: 4,
    },
    dropdownText: {
        fontSize: 16,
        color: '#1A1A1A',
    },
    placeholderText: {
        fontSize: 16,
        color: '#999999',
    },
    arrowIcon: {
        tintColor: '#666666',
    },
    tickIcon: {
        tintColor: '#007A49',
    },
    textInput: {
        height: 52,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#1A1A1A',
        backgroundColor: '#FFFFFF',
    },
    errorBorder: {
        borderColor: '#FF4444',
    },
    errorText: {
        fontSize: 14,
        color: '#FF4444',
        marginTop: 6,
        marginLeft: 4,
    },
    spacer: {
        height: 20,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 34,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    createButton: {
        height: 56,
        backgroundColor: '#007A49',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    createButtonDisabled: {
        backgroundColor: '#E0E0E0',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    loadingIcon: {
        // Animation can be added here
    },
    createButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default CreateProjectScreen;