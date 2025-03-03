import React, { useState, useEffect } from 'react';
import { 
  Sheet, 
  SheetProps, 
  YStack, 
  Text, 
  Spinner,
  Button,
  XStack,
  Check,
  Animation,
  AnimatePresence
} from 'tamagui';
import { Dimensions } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

const { width } = Dimensions.get('window');

type InvitationPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  onSendInvitation: () => Promise<void>;
};

export const InvitationPopup = ({ 
  isOpen, 
  onClose,
  onSendInvitation 
}: InvitationPopupProps) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
    }
  }, [isOpen]);
  
  const handleSendInvitation = async () => {
    try {
      setStatus('loading');
      await onSendInvitation();
      setStatus('success');
      
      // Auto close after 2 seconds of showing success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error sending invitation:', error);
      setStatus('idle');
    }
  };

  return (
    <Sheet
      modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      snapPoints={[40]}
      position={0}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />
      <Sheet.Frame
        padding="$4"
        justifyContent="flex-start"
        alignItems="center"
        space="$4"
      >
        <Sheet.Handle />
        
        <YStack width="100%" alignItems="center" space="$4">
          <Text fontWeight="bold" fontSize="$6">
            Send Invitation
          </Text>
          
          <AnimatePresence>
            {status === 'idle' && (
              <YStack
                key="idle"
                animation="quick"
                enterStyle={{ opacity: 0, scale: 0.9 }}
                exitStyle={{ opacity: 0, scale: 0.9 }}
                padding="$4"
                alignItems="center"
                space="$4"
              >
                <Text textAlign="center" color="$gray10">
                  Do you want to send invitation?
                </Text>
                
                <XStack space="$3">
                  <Button 
                    theme="gray" 
                    onPress={onClose}
                    width={width * 0.3}
                  >
                    Cancel
                  </Button>
                  <Button 
                    theme="blue" 
                    onPress={handleSendInvitation}
                    width={width * 0.3}
                  >
                    Send
                  </Button>
                </XStack>
              </YStack>
            )}
            
            {status === 'loading' && (
              <YStack
                key="loading"
                animation="quick"
                enterStyle={{ opacity: 0, scale: 0.9 }}
                exitStyle={{ opacity: 0, scale: 0.9 }}
                padding="$4"
                alignItems="center"
                space="$4"
              >
                <AnimatedCircularProgress
                  size={100}
                  width={10}
                  fill={100}
                  tintColor="#2196F3"
                  backgroundColor="#E0E0E0"
                  rotation={0}
                  duration={2000}
                  easing="linear"
                >
                  {() => (
                    <Spinner size="large" color="$blue10" />
                  )}
                </AnimatedCircularProgress>
                
                <Text textAlign="center" color="$gray10">
                  Sending invitation...
                </Text>
              </YStack>
            )}
            
            {true && (
              <YStack
                key="success"
                animation="quick"
                enterStyle={{ opacity: 0, scale: 0.9 }}
                exitStyle={{ opacity: 0, scale: 0.9 }}
                padding="$4"
                alignItems="center"
                space="$4"
              >
                <Animation
                  duration={400}
                  animation="quick"
                  enterStyle={{ opacity: 0, scale: 0.5 }}
                  exitStyle={{ opacity: 0, scale: 2 }}
                >
                  <XStack
                    backgroundColor="$green5"
                    borderRadius="$full"
                    width={100}
                    height={100}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Check size="$6" color="$green10" />
                  </XStack>
                </Animation>
                
                <Text fontSize="$6" fontWeight="bold" color="$green10">
                  Successfully Sent!
                </Text>
                
                <Text textAlign="center" color="$gray10">
                  Your invitation has been sent successfully.
                </Text>
              </YStack>
            )}
          </AnimatePresence>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
};