import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Text, Card, Button, useTheme, ActivityIndicator, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { CROP_REPORTS_BASE, getApiBaseUrl } from './config/api';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

interface CropReport {
  id: string;
  cropName: string;
  cropType: string;
  areaHectares: number;
  plantingDate: string;
  status: 'active' | 'completed' | 'abandoned';
  stages: CropStage[];
  createdAt: string;
}

interface CropStage {
  id: string;
  stageName: string;
  stageOrder: number;
  isCompleted: boolean;
  stageDate: string;
  photos: CropStagePhoto[];
}

interface CropStagePhoto {
  id: string;
  photoPath: string;
  photoDescription: string;
  uploadedAt: string;
}

export default function CropReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [cropReport, setCropReport] = useState<CropReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPreview, setPendingPreview] = useState<{ uri: string; stageId: string } | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editValues, setEditValues] = useState<{ cropName: string; areaHectares?: string; description?: string }>({ cropName: '' });

  const uploadsBase = `${getApiBaseUrl()}/uploads`;

  const statusKannadaMap: Record<string, string> = {
    active: 'ಸಕ್ರಿಯ',
    completed: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    abandoned: 'ತ್ಯಜಿಸಲಾಗಿದೆ',
  };

  const statusColorMap: Record<string, string> = {
    active: '#10B981',
    completed: '#6B7280',
    abandoned: '#EF4444',
  };

  const fetchCropReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await fetch(`${CROP_REPORTS_BASE}/${id}`);
      const json = await resp.json();
      setCropReport(json?.data || null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load crop report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCropReport();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleStagePress = async (stage: CropStage) => {
    try {
      // Ask permission and pick an image
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9
      });
      if (res.canceled || !res.assets?.[0]) return;
      const asset = res.assets[0];
      // Show preview and wait for user confirmation
      setPendingPreview({ uri: asset.uri, stageId: String(stage.id) });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to upload');
    }
  };

  const confirmUpload = async () => {
    if (!pendingPreview) return;
    try {
      setIsUploading(true);
      const form = new FormData();

      // Build form data differently for web vs native
      if (Platform.OS === 'web') {
        const resp = await fetch(pendingPreview.uri);
        const blob = await resp.blob();
        const file = new File([blob], `stage_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
        form.append('photo', file);
      } else {
        form.append('photo', {
          uri: pendingPreview.uri,
          name: `stage_${Date.now()}.jpg`,
          type: 'image/jpeg'
        } as any);
      }

      const uploadResp = await fetch(`${CROP_REPORTS_BASE}/stages/${pendingPreview.stageId}/photos`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: form
      });

      if (!uploadResp.ok) {
        const txt = await uploadResp.text();
        Alert.alert('Upload failed', txt || `HTTP ${uploadResp.status}`);
        return;
      }

      setPendingPreview(null);
      await fetchCropReport();
      Alert.alert('Success', 'Photo uploaded');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenEdit = () => {
    if (!cropReport) return;
    setEditValues({
      cropName: cropReport.cropName || '',
      areaHectares: cropReport.areaHectares ? String(cropReport.areaHectares) : '',
      description: ''
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    try {
      const payload: any = { cropName: editValues.cropName.trim() };
      if (editValues.areaHectares) payload.areaHectares = Number(editValues.areaHectares);
      if (editValues.description) payload.description = editValues.description.trim();

      const resp = await fetch(`${CROP_REPORTS_BASE}/${encodeURIComponent(String(id))}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const txt = await resp.text();
        Alert.alert('Update failed', txt || `HTTP ${resp.status}`);
        return;
      }
      setIsEditing(false);
      await fetchCropReport();
      Alert.alert('Updated', 'Crop report updated');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update');
    }
  };

  const handleDeleteReport = async () => {
    if (!id) return;
    Alert.alert('Delete', 'Do you really want to delete this crop report?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const url = `${CROP_REPORTS_BASE}/${encodeURIComponent(String(id))}`;
            const resp = await fetch(url, { method: 'DELETE', headers: { Accept: 'application/json' } });
            if (!resp.ok) {
              let details = '';
              try { details = await resp.text(); } catch {}
              Alert.alert('Delete failed', details || `HTTP ${resp.status}`);
              return;
            }
            Alert.alert('Deleted', 'Crop report deleted');
            router.replace('/crop-reports');
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to delete');
          }
        }
      }
    ]);
  };

  const renderStage = (stage: CropStage) => {
    const hasPhotos = stage.photos && stage.photos.length > 0;
    const latestPhoto = hasPhotos ? stage.photos[stage.photos.length - 1] : null;
    const isLocked = Number(stage.stageOrder) > 1 && !(cropReport?.stages?.find(s => s.stageOrder === (stage.stageOrder - 1))?.photos?.length);

    return (
      <TouchableOpacity
        key={stage.id}
        style={[
          styles.stageCard,
          stage.isCompleted && styles.completedStage,
          hasPhotos && styles.stageWithPhotos,
          isLocked && styles.lockedStage
        ]}
        onPress={() => { if (!isLocked) handleStagePress(stage); }}
        activeOpacity={0.7}
      >
        <View style={styles.stageHeader}>
          <View style={styles.stageInfo}>
            <View style={[
              styles.stageNumber,
              stage.isCompleted ? styles.completedStageNumber : styles.pendingStageNumber
            ]}>
              <Text style={[
                styles.stageNumberText,
                stage.isCompleted ? styles.completedStageNumberText : styles.pendingStageNumberText
              ]}>
                {stage.stageOrder}
              </Text>
            </View>
            <View style={styles.stageDetails}>
              <Text style={styles.stageName}>{stage.stageName}</Text>
              {stage.stageDate && (
                <Text style={styles.stageDate}>
                  Completed: {formatDate(stage.stageDate)}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.stageStatus}>
            {stage.isCompleted ? (
              <MaterialIcons name="check-circle" size={24} color="#10B981" />
            ) : (
              <MaterialIcons name="radio-button-unchecked" size={24} color="#9CA3AF" />
            )}
          </View>
        </View>

        {hasPhotos && latestPhoto && (
          <View style={styles.photoSection}>
            <Image 
              source={{ uri: `${uploadsBase}/${latestPhoto.photoPath}` }} 
              style={styles.stagePhoto}
              resizeMode="cover"
            />
            <View style={styles.photoInfo}>
              <Text style={styles.photoDescription} numberOfLines={2}>
                {latestPhoto.photoDescription || 'Stage photo'}
              </Text>
              <Text style={styles.photoDate}>
                {formatDate(latestPhoto.uploadedAt)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                try {
                  const resp = await fetch(`${CROP_REPORTS_BASE}/stages/${encodeURIComponent(String(stage.id))}/photos/${encodeURIComponent(String(latestPhoto.id))}`, {
                    method: 'DELETE',
                    headers: { Accept: 'application/json' }
                  });
                  if (!resp.ok) {
                    const txt = await resp.text();
                    Alert.alert('Delete failed', txt || `HTTP ${resp.status}`);
                    return;
                  }
                  await fetchCropReport();
                } catch (e: any) {
                  Alert.alert('Error', e?.message || 'Failed to remove');
                }
              }}
              style={styles.removeBadge}
            >
              <MaterialIcons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {!hasPhotos && (
          <View style={styles.noPhotoSection}>
            <MaterialIcons name="add-a-photo" size={20} color="#9CA3AF" />
            <Text style={styles.noPhotoText}>{isLocked ? 'Complete previous stage to unlock' : 'Tap to add photo'}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading crop report...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !cropReport) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error || 'Crop report not found'}</Text>
          <Button mode="contained" onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{cropReport.cropName}</Text>
            <Text style={styles.headerSubtitle}>ಬೆಳೆ ವರದಿ</Text>
          </View>
        </View>
      </View> */}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {pendingPreview && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Preview</Text>
            <Image source={{ uri: pendingPreview.uri }} style={styles.previewImage} />
            <View style={styles.previewActions}>
              <Button mode="outlined" onPress={() => setPendingPreview(null)} disabled={isUploading}>
                Cancel
              </Button>
              <Button mode="contained" onPress={confirmUpload} loading={isUploading} disabled={isUploading}>
                Upload
              </Button>
            </View>
          </View>
        )}
        {/* Crop Info Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.cropInfoHeader}>
              <Text style={styles.cropName}>{cropReport.cropName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity onPress={handleOpenEdit} style={styles.iconButton}>
                  <MaterialIcons name="edit" size={20} color="#374151" />
                </TouchableOpacity>
                {/* <TouchableOpacity onPress={handleDeleteReport} style={[styles.iconButton, { backgroundColor: '#FEE2E2' }]}>
                  <MaterialIcons name="delete" size={20} color="#DC2626" />
                </TouchableOpacity> */}
                <View style={[styles.statusBadge, { backgroundColor: statusColorMap[cropReport.status] + '20' }]}>
                  <Text style={[styles.statusText, { color: statusColorMap[cropReport.status] }]}>
                    {statusKannadaMap[cropReport.status]}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.cropDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Crop Type:</Text>
                <Text style={styles.detailValue}>{cropReport.cropType || 'General Crop'}</Text>
              </View>
              {cropReport.areaHectares && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Area:</Text>
                  <Text style={styles.detailValue}>{cropReport.areaHectares} hectares</Text>
                </View>
              )}
              {cropReport.plantingDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Planted:</Text>
                  <Text style={styles.detailValue}>{formatDate(cropReport.plantingDate)}</Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {isEditing && (
          <Card style={[styles.infoCard, styles.editCard]}>
            <Card.Content>
              <Text style={styles.editTitle}>Edit Crop Report</Text>
              <TextInput
                label="Crop Name"
                mode="outlined"
                value={editValues.cropName}
                onChangeText={(text) => setEditValues((prev) => ({ ...prev, cropName: text }))}
                style={{ marginBottom: 12 }}
              />
              <TextInput
                label="Area (hectares)"
                mode="outlined"
                keyboardType="numeric"
                value={editValues.areaHectares ?? ''}
                onChangeText={(text) => setEditValues((prev) => ({ ...prev, areaHectares: text }))}
                style={{ marginBottom: 12 }}
              />
              <TextInput
                label="Description"
                mode="outlined"
                multiline
                value={editValues.description ?? ''}
                onChangeText={(text) => setEditValues((prev) => ({ ...prev, description: text }))}
                style={{ marginBottom: 12 }}
              />
              <View style={styles.editActions}>
                <Button mode="outlined" onPress={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={handleSaveEdit}>
                  Save
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Stages Section */}
        <View style={styles.stagesSection}>
          <Text style={styles.sectionTitle}>Crop Growth Stages</Text>
          <Text style={styles.sectionSubtitle}>ಬೆಳೆ ಬೆಳವಣಿಗೆಯ ಹಂತಗಳು</Text>
          
          {cropReport.stages?.map(renderStage)}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    color: '#1F2937',
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
  infoCard: {
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cropInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cropName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cropDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  stagesSection: {
    marginBottom: 20,
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
    marginBottom: 16,
  },
  stageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  completedStage: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  stageWithPhotos: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  lockedStage: {
    opacity: 0.5,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stageNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  completedStageNumber: {
    backgroundColor: '#10B981',
  },
  pendingStageNumber: {
    backgroundColor: '#E5E7EB',
  },
  stageNumberText: {
    fontSize: 14,
    fontWeight: '600',
  },
  completedStageNumberText: {
    color: '#fff',
  },
  pendingStageNumberText: {
    color: '#6B7280',
  },
  stageDetails: {
    flex: 1,
  },
  stageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  stageDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  stageStatus: {
    marginLeft: 12,
  },
  photoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  editCard: {
    marginBottom: 16,
  },
  editTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  removeBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  stagePhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  photoInfo: {
    flex: 1,
  },
  photoDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  photoDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  noPhotoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
  },
  noPhotoText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
  },
});
