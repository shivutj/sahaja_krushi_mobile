import React from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Linking } from 'react-native';
import { Text, Card, useTheme, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface DetailSection {
  id: string;
  title: string;
  titleKannada: string;
  content: string;
  contentKannada: string;
  icon: string;
  color: string;
}

interface ContactInfo {
  type: string;
  value: string;
  icon: string;
  action?: () => void;
}

export default function SahajaDetailsScreen() {
  const theme = useTheme();

  const detailSections: DetailSection[] = [
    {
      id: '1',
      title: 'About Sahaja Krushi',
      titleKannada: 'ಸಹಜ ಕೃಷಿ ಬಗ್ಗೆ',
      content: 'Sahaja Krushi is a revolutionary agricultural initiative by the Government of Karnataka that promotes natural and sustainable farming practices. Our mission is to empower farmers with knowledge, technology, and support to achieve better yields while preserving the environment.',
      contentKannada: 'ಸಹಜ ಕೃಷಿ ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ಒಂದು ಕ್ರಾಂತಿಕಾರಿ ಕೃಷಿ ಯೋಜನೆಯಾಗಿದೆ. ಇದು ನೈಸರ್ಗಿಕ ಮತ್ತು ಸುಸ್ಥಿರ ಕೃಷಿ ಪದ್ಧತಿಗಳನ್ನು ಉತ್ತೇಜಿಸುತ್ತದೆ. ನಮ್ಮ ಧ್ಯೇಯ ರೈತರಿಗೆ ಜ್ಞಾನ, ತಂತ್ರಜ್ಞಾನ ಮತ್ತು ಬೆಂಬಲವನ್ನು ನೀಡಿ ಉತ್ತಮ ಇಳುವರಿ ಪಡೆಯಲು ಸಹಾಯ ಮಾಡುವುದು.',
      icon: 'eco',
      color: '#2E7D32'
    },
    {
      id: '2',
      title: 'Our Vision',
      titleKannada: 'ನಮ್ಮ ದೃಷ್ಟಿ',
      content: 'To create a sustainable agricultural ecosystem where farmers can thrive using natural methods, reduce chemical dependency, and contribute to food security while maintaining soil health and biodiversity.',
      contentKannada: 'ರೈತರು ನೈಸರ್ಗಿಕ ವಿಧಾನಗಳನ್ನು ಬಳಸಿ, ರಾಸಾಯನಿಕ ಅವಲಂಬನೆಯನ್ನು ಕಡಿಮೆ ಮಾಡಿ, ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಮತ್ತು ಜೈವಿಕ ವೈವಿಧ್ಯತೆಯನ್ನು ಕಾಪಾಡಿಕೊಂಡು ಆಹಾರ ಭದ್ರತೆಗೆ ಕೊಡುಗೆ ನೀಡುವ ಸುಸ್ಥಿರ ಕೃಷಿ ಪರಿಸರವನ್ನು ಸೃಷ್ಟಿಸುವುದು.',
      icon: 'visibility',
      color: '#1565C0'
    },
    {
      id: '3',
      title: 'Key Features',
      titleKannada: 'ಮುಖ್ಯ ವೈಶಿಷ್ಟ್ಯಗಳು',
      content: '• Digital crop monitoring and reporting\n• Expert agricultural guidance\n• Weather-based farming advice\n• Pest and disease identification\n• Market price information\n• Government scheme updates\n• Community knowledge sharing',
      contentKannada: '• ಡಿಜಿಟಲ್ ಬೆಳೆ ಮೇಲ್ವಿಚಾರಣೆ ಮತ್ತು ವರದಿ\n• ತಜ್ಞ ಕೃಷಿ ಮಾರ್ಗದರ್ಶನ\n• ಹವಾಮಾನ ಆಧಾರಿತ ಕೃಷಿ ಸಲಹೆ\n• ಕೀಟ ಮತ್ತು ರೋಗ ಗುರುತಿಸುವಿಕೆ\n• ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ಮಾಹಿತಿ\n• ಸರ್ಕಾರಿ ಯೋಜನೆ ನವೀಕರಣಗಳು\n• ಸಮುದಾಯ ಜ್ಞಾನ ಹಂಚಿಕೆ',
      icon: 'star',
      color: '#FF9800'
    },
    {
      id: '4',
      title: 'Benefits for Farmers',
      titleKannada: 'ರೈತರಿಗೆ ಪ್ರಯೋಜನಗಳು',
      content: '• Reduced input costs through natural farming\n• Better crop yields and quality\n• Access to expert advice 24/7\n• Government scheme notifications\n• Weather alerts and farming tips\n• Community support and learning\n• Digital record keeping',
      contentKannada: '• ನೈಸರ್ಗಿಕ ಕೃಷಿಯ ಮೂಲಕ ಇನ್ಪುಟ್ ವೆಚ್ಚ ಕಡಿಮೆ\n• ಉತ್ತಮ ಬೆಳೆ ಇಳುವರಿ ಮತ್ತು ಗುಣಮಟ್ಟ\n• 24/7 ತಜ್ಞ ಸಲಹೆಗೆ ಪ್ರವೇಶ\n• ಸರ್ಕಾರಿ ಯೋಜನೆ ಅಧಿಸೂಚನೆಗಳು\n• ಹವಾಮಾನ ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ಕೃಷಿ ಸಲಹೆಗಳು\n• ಸಮುದಾಯ ಬೆಂಬಲ ಮತ್ತು ಕಲಿಕೆ\n• ಡಿಜಿಟಲ್ ದಾಖಲೆ ಇಡುವಿಕೆ',
      icon: 'agriculture',
      color: '#4CAF50'
    }
  ];

  const contactInfo: ContactInfo[] = [
    {
      type: 'Helpline',
      value: '1800-123-4567',
      icon: 'phone',
      action: () => Linking.openURL('tel:18001234567')
    },
    {
      type: 'Email',
      value: 'support@sahajakrushi.gov.in',
      icon: 'email',
      action: () => Linking.openURL('mailto:support@sahajakrushi.gov.in')
    },
    {
      type: 'Website',
      value: 'www.sahajakrushi.gov.in',
      icon: 'language',
      action: () => Linking.openURL('https://www.sahajakrushi.gov.in')
    },
    {
      type: 'Address',
      value: 'Karnataka Agriculture Department, Bengaluru',
      icon: 'location-on'
    }
  ];

  const renderDetailSection = (section: DetailSection) => (
    <Card key={section.id} style={styles.sectionCard}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <View style={[styles.iconContainer, { backgroundColor: section.color + '20' }]}>
            <MaterialIcons name={section.icon as any} size={24} color={section.color} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionTitleKannada}>{section.titleKannada}</Text>
          </View>
        </View>
        <Divider style={styles.divider} />
        <Text style={styles.sectionContent}>{section.content}</Text>
        <Text style={styles.sectionContentKannada}>{section.contentKannada}</Text>
      </Card.Content>
    </Card>
  );

  const renderContactItem = (contact: ContactInfo) => (
    <TouchableOpacity
      key={contact.type}
      style={styles.contactItem}
      onPress={contact.action}
      disabled={!contact.action}
    >
      <View style={styles.contactIcon}>
        <MaterialIcons name={contact.icon as any} size={20} color="#2E7D32" />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactType}>{contact.type}</Text>
        <Text style={styles.contactValue}>{contact.value}</Text>
      </View>
      {contact.action && (
        <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {/* <LinearGradient 
        colors={['#0D5302', '#1B5E20', '#2E7D32']} 
        start={{x: 0, y: 0}} 
        end={{x: 1, y: 1}}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Sahaja Krushi</Text>
            <Text style={styles.headerSubtitle}>ಸಹಜ ಕೃಷಿ ವಿವರಗಳು</Text>
          </View>
        </View>
      </LinearGradient> */}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <MaterialIcons name="eco" size={48} color="#2E7D32" />
          </View>
          <Text style={styles.heroTitle}>Welcome to Sahaja Krushi</Text>
          <Text style={styles.heroSubtitle}>ಸಹಜ ಕೃಷಿಗೆ ಸ್ವಾಗತ</Text>
          <Text style={styles.heroDescription}>
            Empowering farmers with natural farming solutions and digital technology
          </Text>
        </View>

        {/* Detail Sections */}
        <View style={styles.sectionsContainer}>
          {detailSections.map(renderDetailSection)}
        </View>

        {/* Contact Information */}
        <Card style={styles.contactCard}>
          <Card.Content>
            <View style={styles.contactHeader}>
              <MaterialIcons name="contact-phone" size={24} color="#2E7D32" />
              <Text style={styles.contactCardTitle}>Contact Information</Text>
              <Text style={styles.contactCardTitleKannada}>ಸಂಪರ್ಕ ಮಾಹಿತಿ</Text>
            </View>
            <Divider style={styles.divider} />
            {contactInfo.map(renderContactItem)}
          </Card.Content>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 Government of Karnataka
          </Text>
          <Text style={styles.footerSubtext}>
            Digital India Initiative
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  logoContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 50,
    padding: 20,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionTitleKannada: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  divider: {
    marginVertical: 12,
    backgroundColor: '#E5E7EB',
  },
  sectionContent: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 8,
  },
  sectionContentKannada: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  contactCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contactHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  contactCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  contactCardTitleKannada: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactType: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
