import React, { useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native'
import Modal from 'react-native-modal'
import { Ionicons } from '@expo/vector-icons'
import * as Application from 'expo-application'
import * as ImagePicker from 'expo-image-picker'
import { useToast } from 'react-native-toast-notifications'
import { useTranslation } from 'react-i18next'
import i18next from 'src/locales/index'
import { Colors, Typography } from 'src/utils/constants'
import { scaleFont, scaleSize } from 'src/utils/constants/mixins'
import { presingedUrl, submitFeedback } from 'src/api/api.fetch'

interface FeedbackModalProps {
  isVisible: boolean
  onClose: () => void
}

type FeedbackType = 'feedback' | 'issue' | 'translation_fix'

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isVisible, onClose }) => {
  const { t } = useTranslation()
  const toast = useToast()
  const [selectedType, setSelectedType] = useState<FeedbackType>('feedback')
  const [message, setMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const feedbackTypes: { key: FeedbackType; label: string }[] = [
    { key: 'feedback', label: t('label.feedback_type_feedback') },
    { key: 'issue', label: t('label.feedback_type_issue') },
    { key: 'translation_fix', label: t('label.feedback_type_translation') },
  ]

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      toast.show(t('label.feedback_image_permission'), { type: 'warning' })
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    })

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri)
    }
  }

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.show(t('label.feedback_empty_message'), { type: 'warning' })
      return
    }

    setIsSubmitting(true)
    try {
      let uploadedFileName: string | null = null

      if (selectedImage) {
        const presignedResponse = await presingedUrl({
          fileName: String(new Date().getMilliseconds()),
          fileType: 'image/jpg',
          folder: 'feedback',
        })

        if (presignedResponse.response.code !== 'success') {
          throw new Error('Failed to get upload URL')
        }

        const signedUrl = presignedResponse.response.data.data.uploadUrl
        uploadedFileName = presignedResponse.response.data.data.fileName

        const uploadResponse = await fetch(signedUrl, {
          method: 'PUT',
          body: {
            uri: selectedImage,
            type: 'image/jpg',
            name: uploadedFileName || 'image.jpg',
          } as any,
          headers: {
            'Content-Type': 'image/jpg',
          },
        })

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed with status: ${uploadResponse.status}`)
        }
      }

      const params: any = {
        type: selectedType,
        message: message.trim(),
        locale: i18next.language,
        appVersion: Application.nativeApplicationVersion || '',
        deviceInfo: {
          os: Platform.OS,
          osVersion: Platform.Version,
        },
      }

      if (uploadedFileName) {
        params.image = uploadedFileName
      }

      const { success } = await submitFeedback(params)

      if (success) {
        toast.show(t('label.feedback_success'), { type: 'success' })
        resetForm()
        onClose()
      } else {
        toast.show(t('label.feedback_error'), { type: 'danger' })
      }
    } catch {
      toast.show(t('label.feedback_error'), { type: 'danger' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setMessage('')
    setSelectedType('feedback')
    setSelectedImage(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal
      style={styles.modal}
      isVisible={isVisible}
      onBackdropPress={handleClose}
      avoidKeyboard
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('label.feedback_title')}</Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={Colors.TEXT_COLOR} />
          </TouchableOpacity>
        </View>

        <View style={styles.typeSelector}>
          {feedbackTypes.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.typeChip,
                selectedType === item.key && styles.typeChipSelected,
              ]}
              onPress={() => setSelectedType(item.key)}
            >
              <Text
                style={[
                  styles.typeChipText,
                  selectedType === item.key && styles.typeChipTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.textInput}
          placeholder={t('label.feedback_placeholder')}
          placeholderTextColor={Colors.GRAY_TEXT}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <View style={styles.imageSection}>
          {selectedImage ? (
            <View style={styles.imagePreviewWrapper}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close-circle" size={24} color={Colors.ALERT} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={20} color={Colors.NEW_PRIMARY} />
              <Text style={styles.addImageText}>{t('label.feedback_add_image')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.WHITE} size="small" />
          ) : (
            <Text style={styles.submitButtonText}>{t('label.feedback_submit')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

export default FeedbackModal

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  container: {
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: scaleFont(18),
    fontFamily: Typography.FONT_FAMILY_BOLD,
    color: Colors.TEXT_COLOR,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.GRAY_DARK,
    backgroundColor: Colors.WHITE,
  },
  typeChipSelected: {
    backgroundColor: Colors.NEW_PRIMARY,
    borderColor: Colors.NEW_PRIMARY,
  },
  typeChipText: {
    fontSize: scaleFont(13),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.TEXT_COLOR,
  },
  typeChipTextSelected: {
    color: Colors.WHITE,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.GRAY_DARK,
    borderRadius: 10,
    padding: 12,
    fontSize: scaleFont(14),
    fontFamily: Typography.FONT_FAMILY_REGULAR,
    color: Colors.TEXT_COLOR,
    minHeight: scaleSize(120),
    marginBottom: 12,
  },
  imageSection: {
    marginBottom: 16,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.NEW_PRIMARY,
    borderStyle: 'dashed',
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  addImageText: {
    fontSize: scaleFont(13),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.NEW_PRIMARY,
  },
  imagePreviewWrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: scaleSize(80),
    height: scaleSize(80),
    borderRadius: 10,
    backgroundColor: Colors.GRAY_LIGHT,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
  },
  submitButton: {
    backgroundColor: Colors.NEW_PRIMARY,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: scaleFont(16),
    fontFamily: Typography.FONT_FAMILY_SEMI_BOLD,
    color: Colors.WHITE,
  },
})
