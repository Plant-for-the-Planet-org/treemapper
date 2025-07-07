import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Dimensions,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/common/Header';
import useAuthentication from 'src/hooks/useAuthentication'
import { useDispatch } from 'react-redux'
import { updateUserLogin, logoutAppUser, updateNewIntervention } from '../store/slice/appStateSlice';
import { resetProjectState } from '../store/slice/projectStateSlice';
import { resetUserDetails } from '../store/slice/userStateSlice';

const { width } = Dimensions.get('window');

const Troubleshoot = ({ handleFixAuth, handleSyncData, handleLocationPermission, handleCameraPermission, handleNetworkIssue, handleStorageCleanup }) => {
    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const { logoutUser } = useAuthentication()
    const dispatch = useDispatch()


    const handleLogout = async () => {
        try {
            await logoutUser()
            dispatch(resetProjectState())
            dispatch(updateUserLogin(false))
            dispatch(resetUserDetails())
            dispatch(logoutAppUser())
            dispatch(updateNewIntervention())
        } catch (error) {
            console.log("Error occurred while logout")
        }
    }
    const troubleshootItems = [
        {
            id: 'login',
            title: 'Login Issues',
            description: 'Authentication problems',
            icon: 'log-in-outline',
            color: '#007A49',
            modalTitle: 'Fix Authentication Issues',
            modalInfo: 'Having trouble logging in? This will help reset your authentication and clear any cached credentials that might be causing issues.',
            actionText: 'Fix Authentication',
            onAction: handleLogout,
        },
        {
            id: 'species',
            title: 'Species Data',
            description: 'Sync species information',
            icon: 'leaf-outline',
            color: '#2E7D32',
            modalTitle: 'Sync Species Data',
            modalInfo: 'If you\'re missing species data or seeing outdated information, this will refresh your local species database.',
            actionText: 'Sync Data',
            onAction: handleSyncData,
        },
        {
            id: 'location',
            title: 'Location Access',
            description: 'GPS and location permissions',
            icon: 'location-outline',
            color: '#1976D2',
            modalTitle: 'Fix Location Access',
            modalInfo: 'Enable location services to use mapping features and accurate tree positioning.',
            actionText: 'Check Permissions',
            onAction: handleLocationPermission,
        },
        {
            id: 'camera',
            title: 'Camera Issues',
            description: 'Photo capture problems',
            icon: 'camera-outline',
            color: '#F57C00',
            modalTitle: 'Fix Camera Issues',
            modalInfo: 'Resolve camera permission issues and photo capture problems.',
            actionText: 'Fix Camera',
            onAction: handleCameraPermission,
        },
        {
            id: 'network',
            title: 'Network Issues',
            description: 'Connection problems',
            icon: 'wifi-outline',
            color: '#D32F2F',
            modalTitle: 'Fix Network Issues',
            modalInfo: 'Troubleshoot connectivity issues and sync problems with the server.',
            actionText: 'Check Network',
            onAction: handleNetworkIssue,
        },
        {
            id: 'storage',
            title: 'Storage Space',
            description: 'Clear cache and data',
            icon: 'folder-outline',
            color: '#7B1FA2',
            modalTitle: 'Clear Storage',
            modalInfo: 'Free up space by clearing cached data and temporary files.',
            actionText: 'Clear Cache',
            onAction: handleStorageCleanup,
        },
    ];

    const openModal = (item) => {
        setSelectedItem(item);
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setSelectedItem(null);
    };

    const handleAction = () => {
        if (selectedItem && selectedItem.onAction) {
            selectedItem.onAction();
        }
        closeModal();
    };

    const renderTroubleshootCard = ({ item }) => (
        <TouchableOpacity
            style={[styles.card, { borderLeftColor: item.color }]}
            onPress={() => openModal(item)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Header label="Troubleshoot" bgColor='#f8f9fa' note='Fix common issues yourself' />
            <View style={styles.header}>
            </View>

            <FlatList
                data={troubleshootItems}
                renderItem={renderTroubleshootCard}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />

            <Modal
                isVisible={isModalVisible}
                onBackdropPress={closeModal}
                onSwipeComplete={closeModal}
                swipeDirection="down"
                style={styles.modal}
                animationIn="slideInUp"
                animationOut="slideOutDown"
            >
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {selectedItem && (
                        <>
                            <View style={styles.modalIconContainer}>
                                <View style={[styles.modalIcon, { backgroundColor: selectedItem.color + '15' }]}>
                                    <Ionicons name={selectedItem.icon} size={32} color={selectedItem.color} />
                                </View>
                            </View>

                            <Text style={styles.modalTitle}>{selectedItem.modalTitle}</Text>
                            <Text style={styles.modalInfo}>{selectedItem.modalInfo}</Text>

                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: selectedItem.color }]}
                                onPress={handleAction}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.actionButtonText}>{selectedItem.actionText}</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        padding: 20,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#666',
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        width: (width - 52) / 2,
        minHeight: 100,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardContent: {
        flex: 1,
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 12,
        color: '#666',
        lineHeight: 16,
    },
    modal: {
        justifyContent: 'center',
        margin: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    modalHeader: {
        alignSelf: 'stretch',
        alignItems: 'flex-end',
        marginBottom: 10,
    },
    closeButton: {
        padding: 8,
    },
    modalIconContainer: {
        marginBottom: 16,
    },
    modalIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalInfo: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    actionButton: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 25,
        minWidth: 200,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default Troubleshoot;