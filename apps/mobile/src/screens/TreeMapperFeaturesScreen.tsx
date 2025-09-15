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
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import Header from 'src/components/common/Header';
import { sendFeatureRequest } from 'src/api/api.fetch';
import { useDispatch, useSelector } from 'react-redux';
import { updateNewFeatureRequest } from 'src/store/slice/appStateSlice';
import { RootState } from 'src/store';
import BackIcon from 'assets/images/svg/BackIcon.svg'

const { width } = Dimensions.get('window');

const TreeMapperFeaturesScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const dispatch = useDispatch();
  const newFeatureRequest = useSelector((state: RootState) => state.appState.newFeatureRequest);
  const accessToken = useSelector((state: RootState) => state.appState.accessToken);

  const [expandedSections, setExpandedSections] = useState({
    features: true,
    faq: false,
    whatsNext: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleRequestAccess = async () => {
    setIsLoading(true);
    try {
      const response = await sendFeatureRequest();
      if (response.success) {
        dispatch(updateNewFeatureRequest());
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
      icon: 'people',
      color: '#007A49',
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
      icon: 'create',
      color: '#2E86C1',
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
      icon: 'document-text',
      color: '#8E44AD',
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
      icon: 'mail',
      color: '#E67E22',
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
      icon: 'location',
      color: '#E74C3C',
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
      icon: 'leaf',
      color: '#27AE60',
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
      icon: 'notifications',
      color: '#F39C12',
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
      icon: 'analytics',
      color: '#3498DB',
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
    { text: 'User profiles and workspace data', icon: 'person-outline' },
    { text: 'All project information and settings', icon: 'folder-outline' },
    { text: 'Site locations and planning data', icon: 'map-outline' },
    { text: 'Tree records and measurement history', icon: 'leaf-outline' },
    { text: 'Species catalogs and project species', icon: 'library-outline' },
    { text: 'Intervention data and status', icon: 'build-outline' },
    { text: 'Images and documentation', icon: 'image-outline' },
    { text: 'Team member roles and permissions', icon: 'people-outline' }
  ];

  const AccordionSection = ({ title, icon, isExpanded, onToggle, children, color = '#007A49' }) => (
    <View style={styles.accordionContainer}>
      <TouchableOpacity
        style={[styles.accordionHeader, { borderLeftColor: color, borderLeftWidth: 4 }]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.accordionHeaderLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            <Ionicons name={icon} size={20} color={color} />
          </View>
          <Text style={styles.accordionTitle}>{title}</Text>
        </View>
        <View style={[styles.chevronContainer, { backgroundColor: isExpanded ? `${color}10` : 'transparent' }]}>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={color}
          />
        </View>
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.accordionContent}>
          {children}
        </View>
      )}
    </View>
  );

  const FeatureCard = ({ feature }) => (
    <View style={[styles.featureCard, { borderLeftColor: feature.color }]}>
      <View style={styles.featureHeader}>
        <View style={[styles.featureIconContainer, { backgroundColor: `${feature.color}15` }]}>
          <Ionicons name={feature.icon} size={24} color={feature.color} />
        </View>
        <Text style={styles.featureTitle}>{feature.title}</Text>
      </View>
      <Text style={styles.featureDescription}>{feature.description}</Text>
      <View style={styles.featureDetails}>
        {feature.details.map((detail, index) => (
          <View key={index} style={styles.detailItem}>
            <View style={[styles.bulletContainer, { backgroundColor: `${feature.color}20` }]}>
              <Text style={[styles.bullet, { color: feature.color }]}>•</Text>
            </View>
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

  const StepCard = ({ number, title, description, children, isLast }) => (
    <View style={styles.stepCard}>
      <View style={styles.stepHeader}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>{number}</Text>
        </View>
        <View style={styles.stepTitleContainer}>
          <Text style={styles.stepTitle}>{title}</Text>
          {!isLast && <View style={styles.stepConnector} />}
        </View>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepDescription}>{description}</Text>
        {children}
      </View>
    </View>
  );

  const RequestButton = ({ onPress, disabled, loading, requested }) => {
    const getButtonContent = () => {
      if (loading) {
        return (
          <>
            <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
            <Text style={styles.requestButtonText}>Processing...</Text>
          </>
        );
      }

      if (requested) {
        return (
          <>
            <Ionicons name="hourglass" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.requestButtonText}>Request in Progress</Text>
          </>
        );
      }

      return (
        <>
          <Ionicons name="rocket" size={20} color="white" style={{ marginRight: 8 }} />
          <Text style={styles.requestButtonText}>Request Beta Access</Text>
        </>
      );
    };

    return (
      <TouchableOpacity
        style={[
          styles.requestButton,
          (disabled || loading || requested) && styles.requestButtonDisabled
        ]}
        onPress={onPress}
        disabled={disabled || loading || requested}
        activeOpacity={0.8}
      >
        {getButtonContent()}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={{ width: '100%', position: 'absolute' }}>
            <TouchableOpacity style={{
              width: 50,
              height: 50,
              position: 'absolute',
              zIndex: 100,
              top: 20,
              left: 20
            }} onPress={() => { navigation.goBack() }}><BackIcon onPress={() => { navigation.goBack() }} /></TouchableOpacity>
          </View>
          <View style={styles.heroIconContainer}>
            <Text style={styles.heroIcon}>🌱</Text>
          </View>
          <Text style={styles.heroTitle}>TreeMapper Beta</Text>
          <Text style={styles.heroSubtitle}>Next-Generation Forestry Management</Text>
          <Text style={styles.heroDescription}>
            Experience enhanced forestry management with comprehensive new features designed to streamline your reforestation projects and maximize impact.
          </Text>
        </View>

        {/* Features Section */}
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <AccordionSection
            title="New Features"
            icon="sparkles"
            isExpanded={expandedSections.features}
            onToggle={() => toggleSection('features')}
            color="#007A49"
          >
            <View style={styles.featuresGrid}>
              {features.map((feature) => (
                <FeatureCard key={feature.id} feature={feature} />
              ))}
            </View>
          </AccordionSection>

          {/* FAQ Section */}
          <AccordionSection
            title="Frequently Asked Questions"
            icon="help-circle"
            isExpanded={expandedSections.faq}
            onToggle={() => toggleSection('faq')}
            color="#3498DB"
          >
            <View style={styles.faqContainer}>
              {faqData.map((faq) => (
                <FAQItem key={faq.id} faq={faq} />
              ))}
            </View>
          </AccordionSection>

          {/* Process Section */}
          <AccordionSection
            title="What's Next?"
            icon="rocket"
            isExpanded={expandedSections.whatsNext}
            onToggle={() => toggleSection('whatsNext')}
            color="#8E44AD"
          >
            <View style={styles.processContainer}>
              <StepCard
                number="1"
                title="Personal Contact"
                description="Someone from the TreeMapper team will connect with you to discuss your specific needs and setup requirements."
              />

              <StepCard
                number="2"
                title="Data Migration"
                description="All your existing data will be seamlessly migrated to the new dashboard:"
              >
                <View style={styles.migrationGrid}>
                  {migrationData.map((item, index) => (
                    <View key={index} style={styles.migrationItem}>
                      <View style={styles.migrationIconContainer}>
                        <Ionicons name={item.icon} size={16} color="#007A49" />
                      </View>
                      <Text style={styles.migrationText}>{item.text}</Text>
                    </View>
                  ))}
                </View>
              </StepCard>

              <StepCard
                number="3"
                title="Seamless Transition"
                description="All new data registered through TreeMapper will automatically sync with your enhanced dashboard, ensuring continuous workflow."
                isLast
              />
            </View>
          </AccordionSection>

        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.fixedButtonContainer}>
        <RequestButton
          onPress={handleRequestAccess}
          disabled={isLoading || newFeatureRequest}
          loading={isLoading}
          requested={newFeatureRequest}
        />
      </View>

      {/* Success Modal */}
      <Modal
        isVisible={showSuccessModal}
        animationIn="zoomIn"
        animationOut="zoomOut"
        animationInTiming={300}
        animationOutTiming={200}
        backdropOpacity={0.6}
        onBackdropPress={() => setShowSuccessModal(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalIconContainer}>
            <Ionicons name="checkmark-circle" size={60} color="#007A49" />
          </View>
          <Text style={styles.modalTitle}>Request Sent Successfully!</Text>
          <Text style={styles.modalMessage}>
            Thank you for your interest! Someone from the TreeMapper team will contact you soon regarding access to the beta features.
          </Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowSuccessModal(false)}
            activeOpacity={0.8}
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
        animationInTiming={300}
        animationOutTiming={200}
        backdropOpacity={0.6}
        onBackdropPress={() => setShowErrorModal(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalIconContainer}>
            <Ionicons name="alert-circle" size={60} color="#E74C3C" />
          </View>
          <Text style={styles.modalTitle}>Request Failed</Text>
          <Text style={styles.modalMessage}>{errorMessage}</Text>
          <TouchableOpacity
            style={[styles.modalButton, styles.errorButton]}
            onPress={() => setShowErrorModal(false)}
            activeOpacity={0.8}
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
    backgroundColor: '#F8FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for fixed button
  },

  // Hero Section
  heroSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 32,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 50
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#F0F8F4',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIcon: {
    fontSize: 36,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007A49',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: '90%',
  },

  // Accordion Sections
  accordionContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,

  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#FFFFFF',
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accordionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accordionContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FAFBFC',
  },

  // Features
  featuresGrid: {
    gap: 16,
    marginTop: 10
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    flex: 1,
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  featureDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  bullet: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailText: {
    fontSize: 14,
    color: '#4A5568',
    flex: 1,
    lineHeight: 20,
  },

  // FAQ
  faqContainer: {
    gap: 16,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#3498DB',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },

  // Process Steps
  processContainer: {
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    position: 'relative',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8E44AD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    zIndex: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  stepTitleContainer: {
    flex: 1,
    position: 'relative',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
  },
  stepConnector: {
    position: 'absolute',
    left: -28,
    top: 40,
    width: 2,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  stepContent: {
    marginLeft: 56,
  },
  stepDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },

  // Migration Items
  migrationGrid: {
    width: '100%',
  },
  migrationItem: {
    flexDirection: 'row',
    backgroundColor: '#F0F8F4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
    marginVertical: 5
  },
  migrationIconContainer: {
    marginRight: 8,
  },
  migrationText: {
    fontSize: 12,
    color: '#2D3748',
    flex: 1,
  },

  // Fixed Button
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  requestButton: {
    backgroundColor: '#007A49',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#007A49',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  requestButtonDisabled: {
    backgroundColor: '#CBD5E0',
    shadowOpacity: 0.1,
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modals
  modal: {
    margin: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  modalIconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#007A49',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  errorButton: {
    backgroundColor: '#E74C3C',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  bottomSpacer: {
    height: 20,
  },
});

export default TreeMapperFeaturesScreen;