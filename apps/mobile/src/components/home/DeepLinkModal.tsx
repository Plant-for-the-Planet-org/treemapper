import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'src/store';
import { updateInviteId } from 'src/store/slice/tempStateSlice';
import { useDeepLinking } from 'src/hooks/useDeeplink';
import { acceptEmailInvite, acceptLinkInvite, getMobileInviteStatus, getMobileInviteStatusEmail } from 'src/api/api.fetch';

type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'discarded';

interface InviteData {
  uid: string;
  email: string;
  role: string;
  message: string;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
  isExpired: boolean;
  project: {
    uid: string;
    name: string;
    description: string;
    slug: string;
    country: string | null;
    image: string | null;
  };
  invitedBy: {
    uid: string;
    name: string;
    email: string;
    displayName: string;
    image: string;
  };
}

const DeepLinkModal = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);

  const { inviteId } = useSelector((state: RootState) => state.tempState);
  const isLoggedIn = useSelector((state: RootState) => state.appState.isLoggedIn);

  // Initialize deep linking
  useDeepLinking();

  const isVisible = inviteId !== '';
  const inviteType = inviteId.startsWith('bulk:') ? 'bulk' : 'email';
  const inviteCode = inviteType === 'bulk' ? inviteId.replace('bulk:', '') : inviteId;

  useEffect(() => {
    if (isVisible && isLoggedIn) {
      handleInitalStatus();
    }
  }, [isVisible, isLoggedIn]);

  const handleInitalStatus = async () => {
    if (inviteType === 'email') {
      setStatusLoading(true);
      setError(null);
      setInviteData(null);
      try {
        const result = await getMobileInviteStatusEmail(inviteCode);
        console.log('Invite status result:', result);
        if (result?.response?.data) {
          setInviteData(result.response.data);
        } else {
          setError('Failed to fetch invitation details. Please try again.');
        }
      } catch (err) {
        console.error('Error fetching invite status:', err);
        setError('Failed to fetch invitation details. Please try again.');
      } finally {
        setStatusLoading(false);
      }
    }

    if (inviteType === 'bulk') {
      setStatusLoading(true);
      setError(null);
      setInviteData(null);

      try {
        const result = await getMobileInviteStatus(inviteCode);

        if (result?.response?.data) {
          setInviteData(result.response.data);
        } else {
          setError('Failed to fetch invitation details. Please try again.');
        }
      } catch (err) {
        console.error('Error fetching invite status:', err);
        setError('Failed to fetch invitation details. Please try again.');
      } finally {
        setStatusLoading(false);
      }
    }
  }

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (inviteType === 'email') {
        const params = {
          code: inviteCode,
        };

        const result = await acceptEmailInvite(params);

        if (result?.response?.code === 'invite_accepted') {
          // Success - show success message
          setSuccessMessage(result.response.message || 'You have successfully joined the project');
          // Close modal after a delay
          setTimeout(() => {
            handleClose();
          }, 2500);
        } else if (result?.response?.code === 'already_member') {
          // Already a member - show as error
          setError(result.response.message || 'You are already a member of this project');
        } else if (result?.response?.error) {
          // Other error responses
          setError(result.response.message || 'Failed to accept invitation. Please try again.');
        } else {
          // Generic success if no specific code
          setSuccessMessage('Invitation accepted successfully');
          setTimeout(() => {
            handleClose();
          }, 2500);
        }
      }

      if (inviteType === 'bulk') {
        const params = {
          code: inviteCode,
        };

        const result = await acceptLinkInvite(params);

        if (result?.response?.code === 'invite_accepted') {
          // Success - show success message
          setSuccessMessage(result.response.message || 'You have successfully joined the project');
          // Close modal after a delay
          setTimeout(() => {
            handleClose();
          }, 2500);
        } else if (result?.response?.code === 'already_member') {
          // Already a member - show as error
          setError(result.response.message || 'You are already a member of this project');
        } else if (result?.response?.error) {
          // Other error responses
          setError(result.response.message || 'Failed to accept invitation. Please try again.');
        } else {
          // Generic success if no specific code
          setSuccessMessage('Invitation accepted successfully');
          setTimeout(() => {
            handleClose();
          }, 2500);
        }
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('Failed to accept invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    handleClose();
  };

  const handleClose = () => {
    dispatch(updateInviteId(''));
    setError(null);
    setSuccessMessage(null);
    setInviteData(null);
  };

  const handleRetry = () => {
    handleInitalStatus();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusMessage = (status: InviteStatus) => {
    switch (status) {
      case 'accepted':
        return "You've already accepted this invitation";
      case 'declined':
        return "This invitation has been declined";
      case 'expired':
        return "This invitation has expired";
      case 'discarded':
        return "This invitation is no longer valid";
      default:
        return null;
    }
  };

  const renderLoadingState = () => (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color="#007A49" />
      <Text style={styles.loadingText}>Loading invitation details...</Text>
    </View>
  );

  const renderInviteDetails = () => {
    if (!inviteData) return null;

    return (
      <>
        {/* Project Info */}
        <View style={styles.projectContainer}>
          <Text style={styles.projectLabel}>Project</Text>
          <Text style={styles.projectName}>{inviteData.project.name}</Text>
          {inviteData.project.description && (
            <Text style={styles.projectDescription}>
              {inviteData.project.description}
            </Text>
          )}
        </View>

        {/* Role */}
        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#666666" />
            <View style={styles.metaContent}>
              <Text style={styles.metaLabel}>Role</Text>
              <Text style={styles.metaValue}>
                {inviteData.role.charAt(0).toUpperCase() + inviteData.role.slice(1)}
              </Text>
            </View>
          </View>

          {/* Expires At */}
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={20} color="#666666" />
            <View style={styles.metaContent}>
              <Text style={styles.metaLabel}>Expires</Text>
              <Text style={styles.metaValue}>{formatDate(inviteData.expiresAt)}</Text>
            </View>
          </View>

          {/* Invited By */}
          <View style={styles.metaRow}>
            <Image
              source={{ uri: inviteData.invitedBy.image }}
              style={styles.inviterImage}
            />
            <View style={styles.metaContent}>
              <Text style={styles.metaLabel}>Invited by</Text>
              <Text style={styles.metaValue}>{inviteData.invitedBy.displayName}</Text>
            </View>
          </View>
        </View>
      </>
    );
  };

  const renderButtons = () => {
    if (!isLoggedIn) {
      return (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="log-in" size={22} color="#FFFFFF" />
              <Text style={styles.acceptButtonText}>Login to Accept Invite</Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    // Show close button if success message or if invite is not pending
    if (successMessage || !inviteData || inviteData.status !== 'pending') {
      return (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="close-circle-outline" size={22} color="#FFFFFF" />
              <Text style={styles.acceptButtonText}>Close</Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.declineButton]}
          onPress={handleDecline}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.acceptButton, loading && styles.acceptButtonDisabled]}
          onPress={handleAccept}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.acceptButtonText}>Accepting...</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      isVisible={isVisible}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.6}
      style={styles.modal}
      onBackdropPress={!statusLoading ? handleClose : undefined}
      onSwipeComplete={!statusLoading ? handleClose : undefined}
      swipeDirection="down"
    >
      <View style={styles.container}>
        {/* Handle bar */}
        <View style={styles.handleBar} />

        {statusLoading ? (
          renderLoadingState()
        ) : (
          <>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconWrapper}>
                <Ionicons name="mail-open-outline" size={42} color="#007A49" />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>Project Invitation</Text>

            {/* Description or Status Message */}
            {inviteData && inviteData.status !== 'pending' ? (
              <View style={styles.statusMessageContainer}>
                <Text style={styles.statusMessage}>
                  {getStatusMessage(inviteData.status)}
                </Text>
              </View>
            ) : (
              <Text style={styles.description}>
                You've been invited to join a project. Accept this invitation to
                collaborate and contribute to the project.
              </Text>
            )}

            {/* Success Message */}
            {successMessage && (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#2E7D32" />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            )}

            {/* Invite Details or Error */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={20} color="#D32F2F" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleRetry}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh-outline" size={18} color="#007A49" />
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : !successMessage ? (
              renderInviteDetails()
            ) : null}

            {/* Action Buttons */}
            {renderButtons()}
          </>
        )}
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    minHeight: 400,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F0F9F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8F5EC',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  codeContainer: {
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  codeBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  codeText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'monospace',
    textAlign: 'center',
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#D32F2F',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  declineButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#666666',
  },
  acceptButton: {
    backgroundColor: '#007A49',
    shadowColor: '#007A49',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  acceptButtonDisabled: {
    backgroundColor: '#A0C4B4',
    shadowOpacity: 0.1,
    elevation: 2,
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
  acceptButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
    fontWeight: '500',
  },
  statusMessageContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  statusMessage: {
    fontSize: 16,
    color: '#E65100',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 22,
  },
  projectContainer: {
    backgroundColor: '#F0F9F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8F5EC',
  },
  projectLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  projectName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007A49',
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  metaContainer: {
    marginBottom: 24,
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  metaContent: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 2,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  inviterImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0F9F5',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    fontSize: 14,
    color: '#007A49',
    fontWeight: '600',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  successText: {
    flex: 1,
    fontSize: 15,
    color: '#2E7D32',
    lineHeight: 22,
    fontWeight: '600',
  },
});

export default DeepLinkModal;
