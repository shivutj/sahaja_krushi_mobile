import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Modal } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { QUERIES_BASE, getApiBaseUrl } from '../config/api';
import { Video, Audio } from 'expo-av';

export default function QueryDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const uploadsBase = `${getApiBaseUrl()}/uploads`;

  const [showImage, setShowImage] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const fetchOne = async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await fetch(`${QUERIES_BASE}/${id}`);
      const json = await resp.json();
      setItem(json?.data || null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOne();
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'answered':
        return '#10B981';
      case 'open':
        return '#F59E0B';
      case 'closed':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text>Loading query...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.centered}>
        <Text>No query found</Text>
      </View>
    );
  }

  const imageUrl = item.imagePath ? `${uploadsBase}/${item.imagePath}` : null;
  const audioUrl = item.audioPath ? `${uploadsBase}/${item.audioPath}` : null;
  const videoUrl = item.videoPath ? `${uploadsBase}/${item.videoPath}` : null;

  const playAudio = async () => {
    if (audioUrl) {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      setSound(sound);
      await sound.playAsync();
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header with Title + Status */}
      <View style={styles.header}>
        <Text style={styles.title}>Query Details</Text>
        <View style={[styles.statusBox, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      {/* Admin Response */}
      {item.answer && (
        <View style={styles.section}>
          <View style={styles.responseHeader}>
            <Text style={styles.heading}>Admin Response</Text>
            <View style={[styles.responseStatus, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.responseStatusText}>{item.status}</Text>
            </View>
          </View>
          <View style={styles.responseContainer}>
            <Text style={styles.responseText}>{item.answer}</Text>
          </View>
        </View>
      )}

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.heading}>Description</Text>
        <Text style={styles.description}>
          {item.description || 'No description available.'}
        </Text>
      </View>

      {/* Media */}
      <View style={styles.section}>
        <Text style={styles.heading}>Media</Text>

        {/* Image */}
        {imageUrl && (
          <TouchableOpacity onPress={() => setShowImage(true)} style={styles.mediaBlock}>
            <Image source={{ uri: imageUrl }} style={styles.mediaImage} />
            <Text style={styles.mediaHint}>Tap to view image</Text>
          </TouchableOpacity>
        )}

        {/* Audio */}
        {audioUrl && (
          <TouchableOpacity onPress={playAudio} style={[styles.mediaBlock, styles.audioBtn]}>
            <Text style={{ color: '#fff' }}>▶ Play Audio</Text>
          </TouchableOpacity>
        )}

        {/* Video */}
        {videoUrl && (
          <TouchableOpacity onPress={() => setShowVideo(true)} style={styles.mediaBlock}>
            <View style={styles.videoPreview}>
              <Text style={{ color: '#fff' }}>🎥 Tap to play video</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Fullscreen Image Modal */}
      <Modal visible={showImage} transparent={true}>
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setShowImage(false)}>
            <Text style={{ color: '#fff', fontSize: 18 }}>✖ Close</Text>
          </TouchableOpacity>
          <Image source={{ uri: imageUrl! }} style={styles.fullImage} resizeMode="contain" />
        </View>
      </Modal>

      {/* Fullscreen Video Modal */}
      <Modal visible={showVideo} transparent={true}>
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setShowVideo(false)}>
            <Text style={{ color: '#fff', fontSize: 18 }}>✖ Close</Text>
          </TouchableOpacity>
          <Video
            source={{ uri: videoUrl! }}
            style={styles.fullVideo}
            useNativeControls
            resizeMode="contain"
            shouldPlay
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#667eea',
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  statusBox: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontWeight: '600', textTransform: 'capitalize' },

  // Sections
  section: { padding: 16 },
  heading: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  description: { fontSize: 15, lineHeight: 22, color: '#374151' },

  // Media
  mediaBlock: { marginBottom: 16 },
  mediaImage: { width: '100%', height: 180, borderRadius: 8 },
  mediaHint: { marginTop: 6, fontSize: 12, color: '#6b7280' },
  audioBtn: {
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  videoPreview: {
    height: 180,
    backgroundColor: '#111827',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center' },
  modalClose: { position: 'absolute', top: 40, right: 20, zIndex: 1 },
  fullImage: { width: '100%', height: '100%' },
  fullVideo: { width: '100%', height: '100%' },

  // Admin Response
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  responseStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  responseStatusText: {
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
    fontSize: 12,
  },
  responseContainer: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
  },
  responseText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1e40af',
    fontWeight: '500',
  },
});
