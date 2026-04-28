import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const EmailVerificationModal = ({
  isVisible,
  onClose,
  onResendEmail,
  onOkay,
  loading = false,
}) => {
  return (
    <Modal
      isVisible={isVisible}
      backdropOpacity={0.5}
      style={styles.modal}
    >
      <View style={styles.container}>
        {/* Handle bar for swipe gesture */}
        <View style={styles.handleBar} />
        
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconWrapper}>
            <Ionicons name="mail-outline" size={40} color="#007A49" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Verify Your Email</Text>

        {/* Description */}
        <Text style={styles.description}>
          You need to verify your email before you can start using the app. 
          A verification email has been sent to your email address. 
          Please check your email and click the verification link.
        </Text>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {/* <TouchableOpacity
            style={[styles.button, styles.resendButton]}
            onPress={onResendEmail}
            disabled={loading}
          >
            <Ionicons name="refresh-outline" size={18} color="#007A49" />
            <Text style={styles.resendButtonText}>
              {loading ? 'Sending...' : 'Resend Email'}
            </Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={[styles.button, styles.okayButton]}
            onPress={onOkay}
          >
            <Text style={styles.okayButtonText}>Verified</Text>
          </TouchableOpacity>
        </View>

        {/* Helper text */}
        <Text style={styles.helperText}>
          Don't forget to check your spam folder if you don't see the email.
        </Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
    maxHeight: '80%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F9F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8F5EC',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  resendButton: {
    backgroundColor: '#F0F9F5',
    borderWidth: 1,
    borderColor: '#007A49',
    gap: 8,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007A49',
  },
  okayButton: {
    backgroundColor: '#007A49',
  },
  okayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helperText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default EmailVerificationModal;