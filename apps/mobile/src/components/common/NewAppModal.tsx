import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
} from 'react-native';
import Modal from 'react-native-modal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'src/store';
import { updateNewAppModal } from 'src/store/slice/appStateSlice';
import { useNavigation } from '@react-navigation/native';

const NewAppModal = () => {
    const [isVisible, setIsVisible] = useState(false);
    const { showNewAppModal } = useSelector(
        (state: RootState) => state.appState
    )
    const dispatch = useDispatch()
    const { type, v3Approved } = useSelector(
        (state: RootState) => state.userState,
    )
    const navigation = useNavigation()

    useEffect(() => {
        checkIfModalShouldShow();
    }, [type, v3Approved]);

    const checkIfModalShouldShow = async () => {
        if (!showNewAppModal && !v3Approved && type !== '') {
            setIsVisible(true)
        } else {
            if (!showNewAppModal && !v3Approved && type !== '') {
                setIsVisible(false)
                dispatch(updateNewAppModal())
            }
        }
    };

    const handleClose = async () => {
        dispatch(updateNewAppModal())
        setIsVisible(false)
    };

    const handleReadMore = () => {
        navigation.navigate("TreeMapperFeaturesScreen")
        dispatch(updateNewAppModal())
        setIsVisible(false)
    };

    return (
        <Modal
            isVisible={isVisible}
            animationIn="slideInUp"
            animationOut="slideOutDown"
            backdropOpacity={0.5}
            onBackdropPress={handleClose}
            style={styles.modal}
        >
            <View style={styles.modalContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>🎉 New Features Available!</Text>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.description}>
                        TreeMapper now has role management, analytics and more functionality available.
                        Request to start using the beta version of these features.
                    </Text>

                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.button, styles.readMoreButton]}
                        onPress={handleReadMore}
                    >
                        <Text style={styles.readMoreButtonText}>Read More</Text>
                    </TouchableOpacity>
                </View>

                {/* Close button */}
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleClose}
                >
                    <Text style={styles.closeButtonText}>Maybe Later</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modal: {
        margin: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 0,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    header: {
        backgroundColor: '#007A49',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    content: {
        padding: 24,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    readMoreText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    actions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    readMoreButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    readMoreButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
    signupButton: {
        backgroundColor: '#007A49',
    },
    signupButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    closeButton: {
        alignSelf: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    closeButtonText: {
        color: '#999',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});

export default NewAppModal;