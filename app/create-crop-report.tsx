import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Card, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CROP_REPORTS_BASE, FARMERS_BASE } from './config/api';

// Removed CROP_TYPES array as crop type field is no longer needed

export default function CreateCropReportScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  // Removed date picker states
  const [formData, setFormData] = useState({
    cropName: '',
    areaHectares: '',
    description: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Removed date picker handler functions

  const validateForm = () => {
    if (!formData.cropName.trim()) {
      Alert.alert('Error', 'Please enter crop name');
      return false;
    }
    if (formData.areaHectares && isNaN(Number(formData.areaHectares))) {
      Alert.alert('Error', 'Please enter valid area in hectares');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    try {
      // Step 1: Validate input
      if (!formData.cropName.trim()) {
        Alert.alert('Error', 'Please enter crop name');
        return;
      }

      // Step 2: Set loading
      setLoading(true);

      // Step 3: Get farmer session
      const raw = await AsyncStorage.getItem('farmerSession');
      const session = raw ? JSON.parse(raw) : null;

      if (!session || !session.farmerId) {
        Alert.alert('Error', 'Please login again');
        router.push('/');
        return;
      }

      // Step 4: Get farmer database ID
      const farmerUrl = `${FARMERS_BASE}/farmer-id/${encodeURIComponent(session.farmerId)}`;
      const authHeaders: any = { 'Content-Type': 'application/json' };
      if (session?.token) authHeaders.Authorization = `Bearer ${session.token}`;

      const farmerResponse = await fetch(farmerUrl, { headers: authHeaders, signal: AbortSignal.timeout(12000) });
      
      if (!farmerResponse.ok) {
        throw new Error(`Failed to fetch farmer details: ${farmerResponse.status}`);
      }
      
      const farmerData = await farmerResponse.json();
      
      if (!farmerData.success || !farmerData.data) {
        throw new Error('Invalid farmer data received');
      }
      
      const farmerId = farmerData.data.id;

      // Step 5: Create crop report
      const payload = {
        farmerId,
        cropName: formData.cropName.trim(),
        cropType: null,
        areaHectares: formData.areaHectares ? Number(formData.areaHectares) : null,
        plantingDate: null,
        expectedHarvestDate: null,
        description: formData.description.trim() || null
      };

      const response = await fetch(CROP_REPORTS_BASE, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create crop report: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();

      if (result.success) {
        const newId = String(result?.data?.id || '');
        // Navigate directly to crop report detail after creation
        router.replace({ pathname: '/crop-report-detail', params: { id: newId } });
      } else {
        throw new Error(result.message || 'Failed to create crop report');
      }

    } catch (error: any) {
      console.error('Error creating crop report:', error);
      Alert.alert('Error', `Failed to create crop report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <View style={styles.headerContent}>
          <Button
            mode="text"
            onPress={() => router.back()}
            icon="arrow-left"
            textColor="#1F2937"
          >
            Back
          </Button>
          <Text style={styles.headerTitle}>New Crop Report</Text>
          <Text style={styles.headerSubtitle}>ಹೊಸ ಬೆಳೆ ವರದಿ</Text>
        </View>
      </View> */}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.formCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Crop Information</Text>
            <Text style={styles.sectionSubtitle}>ಬೆಳೆ ಮಾಹಿತಿ</Text>

            {/* Crop Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Crop Name *</Text>
              <TextInput
                mode="outlined"
                value={formData.cropName}
                onChangeText={(value) => handleInputChange('cropName', value)}
                placeholder="Enter crop name (e.g., Rice, Tomato)"
                style={styles.input}
              />
            </View>

            {/* Crop Type field removed */}

            {/* Area */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Area (Hectares)</Text>
              <TextInput
                mode="outlined"
                value={formData.areaHectares}
                onChangeText={(value) => handleInputChange('areaHectares', value)}
                placeholder="Enter area in hectares"
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            {/* Date fields removed */}

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                mode="outlined"
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder="Additional notes about your crop..."
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={3}
                style={[styles.input, { color: '#111' }]}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoHeader}>
              <MaterialIcons name="info" size={20} color="#3B82F6" />
              <Text style={styles.infoTitle}>What happens next?</Text>
            </View>
            <Text style={styles.infoText}>
              After creating your crop report, you'll be able to track your crop's growth through different stages:
            </Text>
            <View style={styles.stageList}>
              <Text style={styles.stageItem}>• ಭೂಮಿ ಸಿದ್ಧತೆ - Land preparation and soil setup</Text>
              <Text style={styles.stageItem}>• ಬಿತ್ತನೆ - Sowing seeds or planting seedlings</Text>
              <Text style={styles.stageItem}>• ಬೆಳವಣಿಗೆ - Crop development and growth</Text>
              <Text style={styles.stageItem}>• ಉತ್ಪಾದನೆ - Flowering and fruit development</Text>
              <Text style={styles.stageItem}>• ಕೊಯ್ಲು - Ready for harvest and collection</Text>
            </View>
            <Text style={styles.infoText}>
              You can add photos and notes for each stage to track your crop's progress!
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          Create Crop Report
        </Button>
      </View>

      {/* Date pickers removed */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  formCard: {
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    color: '#111',
  },
  // Removed date picker styles
  // Removed crop type styles as field is no longer used
  infoCard: {
    marginBottom: 16,
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  stageList: {
    marginBottom: 12,
  },
  stageItem: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
  },
  submitContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#10B981',
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
});
