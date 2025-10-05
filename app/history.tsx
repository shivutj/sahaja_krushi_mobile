import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, Linking, Alert } from 'react-native';
import { Text, Card, Chip, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QUERIES_BASE, getApiBaseUrl } from './config/api';

interface HistoryItem {
  id: string;
  title: string;
  titleKannada: string;
  description: string;
  descriptionKannada: string;
  date: string;
  status: 'open' | 'answered' | 'closed' | 'pending' | 'approved' | 'rejected' | 'under_review' | 'escalated';
  statusKannada: string;
  imageUrl: string | null;
  hasAudio: boolean;
  hasVideo: boolean;
  cropType: string;
  cropTypeKannada: string;
  documentUrl?: string | null;
  documentName?: string | null;
}

export default function HistoryScreen() {
  const theme = useTheme();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState<number>(0);

  const uploadsBase = `${getApiBaseUrl()}/uploads`;

  const statusKannadaMap: Record<string, string> = {
    open: 'ತೆರೆದ',
    answered: 'ಉತ್ತರಿಸಿದೆ',
    closed: 'ಮುಚ್ಚಿದೆ',
    escalated: 'ಎಸ್ಕಲೇಟ್ ಮಾಡಲಾಗಿದೆ',
    pending: 'ಬಾಕಿ',
    approved: 'ಅನುಮೋದಿತ',
    rejected: 'ನಿರಾಕರಿಸಲಾಗಿದೆ',
    under_review: 'ಪರಿಶೀಲನೆಯಲ್ಲಿ',
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const raw = await AsyncStorage.getItem('farmerSession');
      const session = raw ? JSON.parse(raw) : null;
      const farmerId = session?.farmerId;
      if (!farmerId) {
        setError('Not logged in');
        setHistoryData([]);
        return;
      }
      const resp = await fetch(`${QUERIES_BASE}/mine?farmerId=${encodeURIComponent(farmerId)}`);
      const json = await resp.json();
      const list = Array.isArray(json?.data) ? json.data : [];
      const mapped: HistoryItem[] = list.map((q: any) => ({
        id: String(q.id),
        title: q.title || 'Query',
        titleKannada: q.title || 'ಪ್ರಶ್ನೆ',
        description: q.description || '—',
        descriptionKannada: q.description || '—',
        date: q.createdAt,
        status: q.status || 'open',
        statusKannada: statusKannadaMap[q.status] || 'ತೆರೆದ',
        imageUrl: q.imagePath ? `${uploadsBase}/${q.imagePath}` : null,
        hasAudio: !!q.audioPath,
        hasVideo: !!q.videoPath,
        cropType: 'Report',
        cropTypeKannada: 'ವರದಿ',
        documentUrl: q.documentUrl || null,
        documentName: q.documentName || null,
      }));
      setHistoryData(mapped);
    } catch (e: any) {
      setError(e?.message || 'Failed to load history');
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      case 'under_review': return '#3B82F6';
      case 'escalated': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return 'check-circle';
      case 'pending': return 'schedule';
      case 'rejected': return 'cancel';
      case 'under_review': return 'visibility';
      default: return 'help';
    }
  };

  const filteredData = selectedFilter === 'all' 
    ? historyData 
    : historyData.filter(item => item.status === selectedFilter);

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity
      style={styles.historyCard}
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/query/QueryById', params: { id: item.id } })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.imageSection}>
          <Image source={item.imageUrl ? { uri: item.imageUrl } : undefined} style={styles.cropImage} />
          <View style={styles.mediaIndicators}>
            {item.hasAudio && (
              <View style={styles.mediaIcon}>
                <MaterialIcons name="mic" size={12} color="#fff" />
              </View>
            )}
            {item.hasVideo && (
              <View style={styles.mediaIcon}>
                <MaterialIcons name="videocam" size={12} color="#fff" />
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.contentSection}>
          <View style={styles.titleRow}>
            <Text style={styles.cropType}>{item.cropType}</Text>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          </View>
          
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          
          <Text style={styles.titleKannada} numberOfLines={1}>
            {item.titleKannada}
          </Text>
          
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>

          {(item.status === 'open' || item.status === 'pending' || item.status === 'under_review') && (
            <TouchableOpacity
              style={[
                styles.escalateButton,
                (Date.now() - new Date(item.date).getTime() < 2 * 60 * 1000) && styles.escalateButtonDisabled
              ]}
              disabled={Date.now() - new Date(item.date).getTime() < 2 * 60 * 1000}
              onPress={async () => {
                try {
                  const resp = await fetch(`${QUERIES_BASE}/${encodeURIComponent(String(item.id))}/escalate`, { method: 'POST', headers: { Accept: 'application/json' } });
                  if (!resp.ok) {
                    const txt = await resp.text();
                    Alert.alert('Escalation failed', txt || `HTTP ${resp.status}`);
                    return;
                  }
                  Alert.alert('Escalated', 'Your query has been escalated to the super admin.');
                  await fetchHistory();
                } catch (e: any) {
                  Alert.alert('Error', e?.message || 'Failed to escalate');
                }
              }}
            >
              <MaterialIcons name="report" size={14} color="#fff" />
              <Text style={styles.escalateText}>Escalate</Text>
            </TouchableOpacity>
          )}

          {item.documentUrl ? (
            <TouchableOpacity
              style={styles.downloadRow}
              onPress={async () => {
                try {
                  const supported = await Linking.canOpenURL(item.documentUrl as string);
                  if (supported) {
                    await Linking.openURL(item.documentUrl as string);
                  } else {
                    Alert.alert('Cannot open', 'No app available to open this document');
                  }
                } catch (e: any) {
                  Alert.alert('Error', e?.message || 'Failed to open document');
                }
              }}
            >
              <MaterialIcons name="download" size={16} color="#1F2937" />
              <Text style={styles.downloadText} numberOfLines={1}>
                {item.documentName || 'Download document'}
              </Text>
            </TouchableOpacity>
          ) : null}
          
          <View style={styles.footer}>
            <Text style={styles.date}>
              {new Date(item.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short'
              })}
            </Text>
            <View style={styles.footerRight}>
              {item.status === 'answered' && (
                <View style={styles.responseIndicator}>
                  <MaterialIcons name="reply" size={14} color="#10B981" />
                  <Text style={styles.responseText}>Response</Text>
                </View>
              )}
              <Chip 
                mode="flat"
                compact
                textStyle={[styles.statusText, { color: getStatusColor(item.status) }]}
                style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '15' }]}
              >
                {item.statusKannada}
              </Chip>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Removed status filters per requirement

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>Report History</Text>
        <Text style={styles.headerSubtitle}>ವರದಿ ಇತಿಹಾಸ</Text>
      </View> */}

      {/* Summary removed */}

      {/* Filter Tabs removed */}

      {/* History List */}
      <FlatList
        data={filteredData}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchHistory}
        ListEmptyComponent={!loading ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: '#64748B' }}>{error ? error : 'No reports yet'}</Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  activeFilterTab: {
    backgroundColor: '#3B82F6',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 6,
  },
  activeFilterLabel: {
    color: '#fff',
  },
  filterCount: {
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  activeFilterCount: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  activeCountText: {
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 16,
  },
  imageSection: {
    position: 'relative',
    marginRight: 16,
  },
  cropImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  mediaIndicators: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
  },
  mediaIcon: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  contentSection: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cropType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  titleKannada: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  responseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  responseText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  escalateButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  escalateButtonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  escalateText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  downloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
    gap: 8,
  },
  downloadText: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
  },
  statusChip: {
    height: 24,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});