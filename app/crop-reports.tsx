import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, FAB, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CROP_REPORTS_BASE, FARMERS_BASE, getApiBaseUrl } from './config/api';

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

export default function CropReportsScreen() {
  const theme = useTheme();
  const [cropReports, setCropReports] = useState<CropReport[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

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

  const fetchCropReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const raw = await AsyncStorage.getItem('farmerSession');
      const session = raw ? JSON.parse(raw) : null;
      const farmerIdString = session?.farmerId; // Get the farmerId string
      
      if (!farmerIdString) {
        setError('Not logged in');
        setCropReports([]);
        return;
      }

      // Get the farmer's database ID by fetching farmer details
      const farmerResponse = await fetch(`${FARMERS_BASE}/farmer-id/${encodeURIComponent(farmerIdString)}`);
      const farmerData = await farmerResponse.json();
      
      if (!farmerData.success) {
        setError('Failed to get farmer details');
        setCropReports([]);
        return;
      }
      
      const farmerId = farmerData.data.id; // Get the database ID

      const resp = await fetch(`${CROP_REPORTS_BASE}/farmer/${farmerId}`);
      const json = await resp.json();
      const reports = Array.isArray(json?.data) ? json.data : [];
      setCropReports(reports);
    } catch (e: any) {
      setError(e?.message || 'Failed to load crop reports');
      setCropReports([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCropReports();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchCropReports();
  }, []);

  const getProgressPercentage = (stages: CropStage[]) => {
    if (!stages || stages.length === 0) return 0;
    const completedStages = stages.filter(stage => stage.isCompleted).length;
    return Math.round((completedStages / stages.length) * 100);
  };

  const getLatestStage = (stages: CropStage[]) => {
    if (!stages || stages.length === 0) return null;
    return stages.find(stage => stage.isCompleted) || stages[0];
  };

  const getNextStage = (stages: CropStage[]) => {
    if (!stages || stages.length === 0) return null;
    const nextIncompleteStage = stages.find(stage => !stage.isCompleted);
    return nextIncompleteStage || stages[stages.length - 1];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderCropReport = ({ item }: { item: CropReport }) => {
    const progress = getProgressPercentage(item.stages);
    const latestStage = getLatestStage(item.stages);
    const nextStage = getNextStage(item.stages);
    const latestPhoto = latestStage?.photos?.[0];

    return (
      <TouchableOpacity
        style={styles.cropReportCard}
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/crop-report-detail', params: { id: item.id } })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cropInfo}>
            <Text style={styles.cropName}>{item.cropName}</Text>
            <Text style={styles.cropType}>{item.cropType || 'General Crop'}</Text>
            <Text style={styles.plantingDate}>
              Planted: {formatDate(item.plantingDate)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColorMap[item.status] + '20' }]}>
            <Text style={[styles.statusText, { color: statusColorMap[item.status] }]}>
              {statusKannadaMap[item.status]}
            </Text>
          </View>
        </View>

        {/* Next Stage Information */}
        {nextStage && (
          <View style={styles.nextStageSection}>
            <View style={styles.nextStageHeader}>
              <MaterialIcons name="arrow-forward" size={16} color="#10B981" />
              <Text style={styles.nextStageLabel}>Next Stage</Text>
            </View>
            <Text style={styles.nextStageName}>{nextStage.stageName}</Text>
            {nextStage.photos && nextStage.photos.length > 0 && (
              <View style={styles.photoPreview}>
                <MaterialIcons name="photo" size={16} color="#6B7280" />
                <Text style={styles.photoText}>
                  {nextStage.photos[0].photoDescription || 'Stage photo available'}
                </Text>
              </View>
            )}
          </View>
        )}

        {latestPhoto && (
          <View style={styles.photoPreview}>
            <MaterialIcons name="photo" size={16} color="#6B7280" />
            <Text style={styles.photoText}>
              {latestStage?.stageName} - {latestPhoto.photoDescription || 'Latest photo'}
            </Text>
          </View>
        )}

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressPercentage}>{progress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progress}%`, backgroundColor: statusColorMap[item.status] }
              ]} 
            />
          </View>
          <Text style={styles.stageInfo}>
            {item.stages?.filter(s => s.isCompleted).length || 0} of {item.stages?.length || 0} stages completed
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.createdDate}>
            Created: {formatDate(item.createdAt)}
          </Text>
          <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading crop reports...</Text>
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
            <Text style={styles.headerTitle}>My Crop Reports</Text>
            <Text style={styles.headerSubtitle}>ನನ್ನ ಬೆಳೆ ವರದಿಗಳು</Text>
          </View>
        </View>
      </View> */}

      {/* Crop Reports List */}
      <FlatList
        data={cropReports}
        renderItem={renderCropReport}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4f46e5']}
            tintColor="#4f46e5"
          />
        }
        ListEmptyComponent={!loading && (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="agriculture" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>
              {error ? 'Failed to load crop reports' : 'No crop reports yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {error ? 'Please try again' : 'Start tracking your crops by creating a new report'}
            </Text>
          </View>
        )}
      />

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        label="New Crop Report"
        onPress={() => router.push('/create-crop-report')}
      />
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
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for FAB
  },
  cropReportCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cropInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cropType: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  plantingDate: {
    fontSize: 12,
    color: '#9CA3AF',
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
  nextStageSection: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  nextStageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  nextStageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 6,
  },
  nextStageName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  photoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  photoText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  stageInfo: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createdDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#10B981',
  },
});
