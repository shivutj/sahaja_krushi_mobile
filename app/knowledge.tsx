import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, Chip, useTheme, Searchbar, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { QUERIES_BASE, getApiBaseUrl } from './config/api';

interface KnowledgeItem {
  id: string;
  title: string;
  titleKannada: string;
  description: string;
  descriptionKannada: string;
  answer: string;
  answerKannada: string;
  date: string;
  status: 'answered' | 'closed';
  imageUrl: string | null;
  hasAudio: boolean;
  hasVideo: boolean;
  farmer: {
    fullName: string;
    farmerId: string;
    district: string;
  };
}

export default function KnowledgeScreen() {
  const theme = useTheme();
  const [knowledgeData, setKnowledgeData] = useState<KnowledgeItem[]>([]);
  const [filteredData, setFilteredData] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const uploadsBase = `${getApiBaseUrl()}/uploads`;

  const statusKannadaMap: Record<string, string> = {
    answered: 'ಉತ್ತರಿಸಿದೆ',
    closed: 'ಮುಚ್ಚಿದೆ',
  };

  const fetchKnowledge = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await fetch(`${QUERIES_BASE}/answered`);
      const json = await resp.json();
      const list = Array.isArray(json?.data) ? json.data : [];
      const mapped: KnowledgeItem[] = list.map((q: any) => ({
        id: String(q.id),
        title: q.title || 'Query',
        titleKannada: q.title || 'ಪ್ರಶ್ನೆ',
        description: q.description || '—',
        descriptionKannada: q.description || '—',
        answer: q.answer || '—',
        answerKannada: q.answer || '—',
        date: q.createdAt,
        status: q.status || 'answered',
        imageUrl: q.imagePath ? `${uploadsBase}/${q.imagePath}` : null,
        hasAudio: !!q.audioPath,
        hasVideo: !!q.videoPath,
        farmer: {
          fullName: q.farmer?.fullName || 'Unknown',
          farmerId: q.farmer?.farmerId || 'N/A',
          district: q.farmer?.district || 'N/A',
        },
      }));
      setKnowledgeData(mapped);
      setFilteredData(mapped);
    } catch (e: any) {
      setError(e?.message || 'Failed to load knowledge base');
      setKnowledgeData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchKnowledge();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredData(knowledgeData);
    } else {
      const filtered = knowledgeData.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.farmer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.farmer.district.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchQuery, knowledgeData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return '#10B981';
      case 'closed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const renderKnowledgeItem = ({ item }: { item: KnowledgeItem }) => (
    <TouchableOpacity
      style={styles.knowledgeCard}
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/query/QueryById', params: { id: item.id } })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.imageSection}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.queryImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <MaterialIcons name="help-outline" size={24} color="#9CA3AF" />
            </View>
          )}
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
            <Text style={styles.farmerInfo}>
              {item.farmer.fullName} • {item.farmer.district}
            </Text>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          </View>
          
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.responsePreview}>
            <View style={styles.responseHeader}>
              <MaterialIcons name="admin-panel-settings" size={14} color="#3B82F6" />
              <Text style={styles.responseLabel}>Admin Response</Text>
            </View>
            <Text style={styles.responseText} numberOfLines={2}>
              {item.answer}
            </Text>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.date}>
              {new Date(item.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: '2-digit'
              })}
            </Text>
            <Chip 
              mode="flat"
              compact
              textStyle={[styles.statusText, { color: getStatusColor(item.status) }]}
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '15' }]}
            >
              {statusKannadaMap[item.status]}
            </Chip>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading knowledge base...</Text>
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
            <Text style={styles.headerTitle}>Knowledge Base</Text>
            <Text style={styles.headerSubtitle}>ಜ್ಞಾನ ಆಧಾರ</Text>
          </View>
        </View>
      </View> */}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search queries and responses..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
      </View>

      {/* Knowledge List */}
      <FlatList
        data={filteredData}
        renderItem={renderKnowledgeItem}
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
            <MaterialIcons name="school" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching queries found' : 'No knowledge base available'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try a different search term' : 'Check back later for updates'}
            </Text>
          </View>
        )}
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  searchBar: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  knowledgeCard: {
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
  queryImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
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
  farmerInfo: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
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
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 8,
  },
  responsePreview: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  responseLabel: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    marginLeft: 4,
  },
  responseText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
    fontStyle: 'italic',
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
  statusChip: {
    height: 24,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
});
