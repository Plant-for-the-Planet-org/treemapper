import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import Header from 'src/components/common/Header';
import { sendFeatureRequest } from 'src/api/api.fetch';
import { useDispatch, useSelector } from 'react-redux';
import { updateNewFeatureRequest } from 'src/store/slice/appStateSlice';
import { RootState } from 'src/store';

const TreeMapperFeaturesScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const dispatch = useDispatch()
  const newFeatureRequest = useSelector((state: RootState) => state.appState.newFeatureRequest)

  const [expandedSections, setExpandedSections] = useState({
    features: false,
    faq: false,
    whatsNext: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleRequestAccess = async () => {
    setIsLoading(true);
    try {
      const response = await sendFeatureRequest()
      if (response.success) {
        dispatch(updateNewFeatureRequest())
        setShowSuccessModal(true);
      } else {
        throw new Error('Failed to send request');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Something went wrong. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      id: 1,
      title: 'Role Management',
      icon: 'people-outline',
      description: 'Comprehensive user access control with workspace and project-level permissions.',
      details: [
        'Workspace roles: Owner, Admin, Member',
        'Project roles: Owner, Admin, Contributor, Observer',
        'Site-specific access controls',
        'Granular permission management'
      ]
    },
    {
      id: 2,
      title: 'Intervention Management',
      icon: 'create-outline',
      description: 'Advanced tools for managing and editing intervention data.',
      details: [
        'Edit existing intervention records',
        'Update intervention status and dates',
        'Modify location and area data',
        'Manage intervention species and counts'
      ]
    },
    {
      id: 3,
      title: 'Audit Logging',
      icon: 'document-text-outline',
      description: 'Complete tracking of all changes and actions in your workspace.',
      details: [
        'Track all user actions and data changes',
        'Monitor project and site modifications',
        'View detailed change history',
        'Export audit reports for compliance'
      ]
    },
    {
      id: 4,
      title: 'Email & Bulk Invitations',
      icon: 'mail-outline',
      description: 'Streamlined team collaboration with advanced invitation features.',
      details: [
        'Send bulk invitations to multiple users',
        'Email domain restrictions for organizations',
        'Custom invitation messages',
        'Track invitation status and responses'
      ]
    },
    {
      id: 5,
      title: 'Advanced Site Management',
      icon: 'location-outline',
      description: 'Enhanced site planning and status tracking capabilities.',
      details: [
        'Detailed site status tracking (planned, active, completed)',
        'Site planning with expected tree counts',
        'Soil type and environmental data',
        'Accessibility and water access information'
      ]
    },
    {
      id: 6,
      title: 'Tree Health Monitoring',
      icon: 'leaf-outline',
      description: 'Comprehensive tree health assessment and tracking system.',
      details: [
        'Detailed health scoring (0-100 scale)',
        'Growth rate monitoring',
        'Disease and pest tracking',
        'Scheduled health assessments'
      ]
    },
    {
      id: 7,
      title: 'Notification System',
      icon: 'notifications-outline',
      description: 'Real-time updates and alerts for important project activities.',
      details: [
        'Project milestone notifications',
        'Team activity updates',
        'Health assessment reminders',
        'System-wide announcements'
      ]
    },
    {
      id: 8,
      title: 'Analytics & KPIs',
      icon: 'analytics-outline',
      description: 'Powerful insights and key performance indicators for your projects.',
      details: [
        'Tree survival and growth rates',
        'Project completion metrics',
        'Species diversity analytics',
        'Site performance comparisons'
      ]
    }
  ];

  const faqData = [
    {
      id: 1,
      question: 'Is the beta version free to use?',
      answer: 'Yes, access to all beta features is completely free during the beta period. There are no charges or commitments required.'
    },
    {
      id: 2,
      question: 'Will my existing data be safe during migration?',
      answer: 'Absolutely. We use secure, tested migration processes that preserve all your data integrity. Your original data remains untouched as a backup during the transition.'
    },
    {
      id: 3,
      question: 'How long does the migration process take?',
      answer: 'Most migrations complete within 24-48 hours depending on data volume. You\'ll receive updates throughout the process and can continue using TreeMapper normally.'
    },
    {
      id: 4,
      question: 'Can I invite my team members to the beta?',
      answer: 'Yes! Once you have access, you can invite unlimited team members using our bulk invitation feature. They\'ll get access to all the same beta features.'
    },
    {
      id: 5,
      question: 'What happens to my data if I don\'t continue after beta?',
      answer: 'Your data remains yours. We can export all your information in standard formats, and you can continue using the regular TreeMapper version without any issues.'
    },
    {
      id: 6,
      question: 'Do I need special training for the new features?',
      answer: 'The new features are designed to be intuitive. However, our team provides personalized onboarding and training materials to help you get the most out of the enhanced capabilities.'
    },
    {
      id: 7,
      question: 'Can I provide feedback on the beta features?',
      answer: 'We encourage it! Your feedback is invaluable for improving the platform. You\'ll have direct access to our development team to share suggestions and report any issues.'
    }
  ];

  const migrationData = [
    'User profiles and workspace data',
    'All project information and settings',
    'Site locations and planning data',
    'Tree records and measurement history',
    'Species catalogs and project species',
    'Intervention data and status',
    'Images and documentation',
    'Team member roles and permissions'
  ];

  const AccordionSection = ({ title, icon, isExpanded, onToggle, children }) => (
    <View style={styles.accordionContainer}>
      <TouchableOpacity style={styles.accordionHeader} onPress={onToggle}>
        <View style={styles.accordionHeaderLeft}>
          <Ionicons name={icon} size={24} color="#007A49" />
          <Text style={styles.accordionTitle}>{title}</Text>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#666"
        />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.accordionContent}>
          {children}
        </View>
      )}
    </View>
  );

  const FeatureCard = ({ feature }) => (
    <View style={styles.featureCard}>
      <View style={styles.featureHeader}>
        <Ionicons name={feature.icon} size={20} color="#007A49" />
        <Text style={styles.featureTitle}>{feature.title}</Text>
      </View>
      <Text style={styles.featureDescription}>{feature.description}</Text>
      <View style={styles.featureDetails}>
        {feature.details.map((detail, index) => (
          <View key={index} style={styles.detailItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.detailText}>{detail}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const FAQItem = ({ faq }) => (
    <View style={styles.faqItem}>
      <Text style={styles.faqQuestion}>{faq.question}</Text>
      <Text style={styles.faqAnswer}>{faq.answer}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header label={'New Features'} />
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ minHeight: '100%' }}>
          <View style={styles.introSection}>
            <Text style={styles.introTitle}>🌱 Welcome to TreeMapper Beta</Text>
            <Text style={styles.introText}>
              Experience enhanced forestry management with our comprehensive new features designed to streamline your reforestation projects.
            </Text>
          </View>

          {/* New Features Accordion */}
          <AccordionSection
            title="New Features"
            icon="sparkles-outline"
            isExpanded={expandedSections.features}
            onToggle={() => toggleSection('features')}
          >
            {features.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </AccordionSection>

          {/* FAQ Accordion */}
          <AccordionSection
            title="Frequently Asked Questions"
            icon="help-circle-outline"
            isExpanded={expandedSections.faq}
            onToggle={() => toggleSection('faq')}
          >
            {faqData.map((faq) => (
              <FAQItem key={faq.id} faq={faq} />
            ))}
          </AccordionSection>

          {/* What's Next Accordion */}
          <AccordionSection
            title="What's Next?"
            icon="rocket-outline"
            isExpanded={expandedSections.whatsNext}
            onToggle={() => toggleSection('whatsNext')}
          >
            <View style={styles.processStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Personal Contact</Text>
                <Text style={styles.stepDescription}>
                  Someone from the TreeMapper team will connect with you to discuss your specific needs and setup requirements.
                </Text>
              </View>
            </View>

            <View style={styles.processStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Data Migration</Text>
                <Text style={styles.stepDescription}>
                  All your existing data will be seamlessly migrated to the new dashboard:
                </Text>
                <View style={styles.migrationList}>
                  {migrationData.map((item, index) => (
                    <View key={index} style={styles.migrationItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#007A49" />
                      <Text style={styles.migrationText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.processStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Seamless Transition</Text>
                <Text style={styles.stepDescription}>
                  All new data registered through TreeMapper will automatically sync with your enhanced dashboard, ensuring continuous workflow.
                </Text>
              </View>
            </View>
          </AccordionSection>

          {/* Request Access Button */}
          {newFeatureRequest ? null  :<View style={{ flex: 1, justifyContent: "flex-end", alignItems: 'center', width: '100%', paddingBottom: 50 }}>
            <View style={styles.requestSection}>
              <TouchableOpacity
                style={[styles.requestButton, isLoading || newFeatureRequest?styles.requestButtonDisabled:{}]}
                onPress={handleRequestAccess}
                disabled={isLoading || newFeatureRequest}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="rocket-outline" size={20} color="white" />
                    <Text style={styles.requestButtonText}>{newFeatureRequest ? "Request Access to Beta Features" : "Request Access to Beta Features"}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>}
        </ScrollView>
      </View>
      {/* Success Modal */}
      <Modal
        isVisible={showSuccessModal}
        animationIn="zoomIn"
        animationOut="zoomOut"
        backdropOpacity={0.5}
        onBackdropPress={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalContent}>
          <Ionicons name="checkmark-circle" size={60} color="#007A49" />
          <Text style={styles.modalTitle}>Request Sent Successfully!</Text>
          <Text style={styles.modalMessage}>
            Thank you for your interest! Someone from the TreeMapper team will contact you soon regarding access to the beta features.
          </Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowSuccessModal(false)}
          >
            <Text style={styles.modalButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        isVisible={showErrorModal}
        animationIn="zoomIn"
        animationOut="zoomOut"
        backdropOpacity={0.5}
        onBackdropPress={() => setShowErrorModal(false)}
      >
        <View style={styles.modalContent}>
          <Ionicons name="alert-circle" size={60} color="#DC3545" />
          <Text style={styles.modalTitle}>Request Failed</Text>
          <Text style={styles.modalMessage}>
            {errorMessage}
          </Text>
          <TouchableOpacity
            style={[styles.modalButton, styles.errorButton]}
            onPress={() => setShowErrorModal(false)}
          >
            <Text style={styles.modalButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginRight: 40,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  introSection: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  accordionContainer: {
    backgroundColor: 'white',
    marginBottom: 12,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accordionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  accordionContent: {
    padding: 20,
    paddingTop: 0,
  },
  featureCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007A49',
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  featureDetails: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bullet: {
    color: '#007A49',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    marginTop: 2,
  },
  detailText: {
    fontSize: 13,
    color: '#555',
    flex: 1,
    lineHeight: 18,
  },
  faqItem: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  processStep: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007A49',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  migrationList: {
    marginTop: 8,
  },
  migrationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  migrationText: {
    fontSize: 13,
    color: '#555',
    marginLeft: 8,
    flex: 1,
  },
  requestSection: {
    padding: 20,
    alignItems: 'center',
  },
  requestButton: {
    backgroundColor: '#007A49',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  requestButtonDisabled: {
    opacity: 0.7,
  },
  requestButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  requestNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    margin: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#007A49',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  errorButton: {
    backgroundColor: '#DC3545',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TreeMapperFeaturesScreen;