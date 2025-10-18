import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CROP_REPORTS_BASE, FARMERS_BASE, getApiBaseUrl } from './config/api';

export default function CreateCropReportScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [cropName, setCropName] = useState('');
  const [areaHectares, setAreaHectares] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    console.log('=== CROP REPORT CREATION ===');
    
    try {
      // Step 1: Validate input
      if (!cropName.trim()) {
        Alert.alert('Error', 'Please enter crop name');
        return;
      }
      console.log('✓ Validation passed');

      // Step 2: Set loading
      setLoading(true);
      console.log('✓ Loading set to true');

      // Step 3: Get farmer session
      const raw = await AsyncStorage.getItem('farmerSession');
      const session = raw ? JSON.parse(raw) : null;
      console.log('Farmer session:', session);

      if (!session || !session.farmerId) {
        Alert.alert('Error', 'Please login again');
        router.push('/');
        return;
      }
      console.log('✓ Farmer session found');

      // Step 4: Try to get farmer database ID; fallback if unauthorized
      let farmerId: number | null = null;
      try {
        const farmerUrl = `${FARMERS_BASE}/farmer-id/${encodeURIComponent(session.farmerId)}`;
        console.log('Fetching farmer from:', farmerUrl);
        const farmerResponse = await fetch(farmerUrl, { headers: { Accept: 'application/json' } });
        console.log('Farmer response status:', farmerResponse.status);
        if (!farmerResponse.ok) throw new Error(String(farmerResponse.status));
        const farmerData = await farmerResponse.json();
        console.log('Farmer data:', farmerData);
        if (farmerData?.success && farmerData?.data?.id) {
          farmerId = farmerData.data.id;
        }
      } catch (e) {
        console.log('Farmer fetch failed, using fallback with external id');
        farmerId = null;
      }

      // Step 5: Create crop report
      const payload = {
        farmerId: farmerId ?? undefined,
        farmerExternalId: session.farmerId,
        cropName: cropName.trim(),
        cropType: null,
        areaHectares: areaHectares ? Number(areaHectares) : null,
        plantingDate: null,
        expectedHarvestDate: null,
        description: description.trim() || null
      };
      console.log('Payload:', payload);

      const response = await fetch(CROP_REPORTS_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Crop report response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Crop report creation failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Crop report result:', result);

      if (result.success) {
        console.log('✓ Crop report created successfully');
        Alert.alert('Success', 'Crop report created successfully!', [
          { text: 'OK', onPress: () => router.replace('/crop-reports') }
        ]);
      } else {
        throw new Error(result.message || 'Failed to create crop report');
      }

    } catch (error: any) {
      console.error('Error:', error);
      Alert.alert('Error', `Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Crop Report</Text>
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.label}>Crop Name *</Text>
          <TextInput
            mode="outlined"
            value={cropName}
            onChangeText={setCropName}
            placeholder="Enter crop name"
            style={styles.input}
            theme={{ 
              colors: { 
                text: '#000',
                primary: '#388E3C',
                outline: 'rgba(46, 125, 50, 0.3)',
                background: '#fff',
                onSurface: '#000',
                onSurfaceVariant: '#666',
              } 
            }}
          />

          <Text style={styles.label}>Area (Hectares)</Text>
          <TextInput
            mode="outlined"
            value={areaHectares}
            onChangeText={setAreaHectares}
            placeholder="Enter area in hectares"
            keyboardType="numeric"
            style={styles.input}
            theme={{ 
              colors: { 
                text: '#000',
                primary: '#388E3C',
                outline: 'rgba(46, 125, 50, 0.3)',
                background: '#fff',
                onSurface: '#000',
                onSurfaceVariant: '#666',
              } 
            }}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            mode="outlined"
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            multiline
            numberOfLines={3}
            style={styles.input}
            theme={{ 
              colors: { 
                text: '#000',
                primary: '#388E3C',
                outline: 'rgba(46, 125, 50, 0.3)',
                background: '#fff',
                onSurface: '#000',
                onSurfaceVariant: '#666',
              } 
            }}
          />
        </Card>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.button}
          buttonColor="#388E3C"
        >
          Create Crop Report
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    paddingVertical: 8,
  },
});
