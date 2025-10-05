import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, Platform } from 'react-native';
import { Text, Button, TextInput, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Video, ResizeMode } from 'expo-av';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QUERIES_BASE } from './config/api';

export default function UploadScreen() {
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  React.useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      setHasPermission(cameraStatus === 'granted' && audioStatus === 'granted');
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setAudioUri(uri);
    setRecording(null);
  };

  const startVideoRecording = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to record video');
    }
  };

  const removeImage = () => setSelectedImage(null);
  const removeAudio = () => setAudioUri(null);
  const removeVideo = () => setVideoUri(null);

  const guessMime = (uri: string): string => {
    const lower = uri.split('?')[0].toLowerCase();
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.mp4') || lower.endsWith('.mov')) return 'video/mp4';
    if (lower.endsWith('.m4a')) return 'audio/m4a';
    if (lower.endsWith('.aac')) return 'audio/aac';
    return 'application/octet-stream';
  };

  const appendFormFile = async (form: FormData, field: string, uri: string, name: string) => {
    if (Platform.OS === 'web') {
      const res = await fetch(uri);
      const blob = await res.blob();
      const type = blob.type || guessMime(uri);
      // @ts-ignore - File exists on web
      const file = new File([blob], name, { type });
      form.append(field, file as any);
    } else {
      form.append(field, { uri, name, type: guessMime(uri) } as any);
    }
  };

  const submitReport = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const raw = await AsyncStorage.getItem('farmerSession');
      const session = raw ? JSON.parse(raw) : null;
      const farmerId = session?.farmerId;
      if (!farmerId) {
        Alert.alert('Not logged in', 'Please login again to submit a query.');
        setIsSubmitting(false);
        return;
      }

      const form = new FormData();
      form.append('farmerId', farmerId);
      if (description) form.append('description', description);
      if (selectedImage) {
        const name = `image_${Date.now()}.jpg`;
        await appendFormFile(form, 'image', selectedImage, name);
      }
      if (audioUri) {
        const name = `audio_${Date.now()}.m4a`;
        await appendFormFile(form, 'audio', audioUri, name);
      }
      if (videoUri) {
        const name = `video_${Date.now()}.mp4`;
        await appendFormFile(form, 'video', videoUri, name);
      }

      // Use fetch for React Native multipart reliability
      const resp = await fetch(`${QUERIES_BASE}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: form,
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || `HTTP ${resp.status}`);
      }

      // Notify admins (fire-and-forget)
      try {
        await fetch(`${QUERIES_BASE}/admin-contacts`, { method: 'GET', headers: { Accept: 'application/json' } });
      } catch {}

      // Navigate to home with success flag after successful upload
      router.replace('/home?uploaded=1');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to submit query.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <View style={styles.permissionCard}>
          <MaterialIcons name="settings" size={48} color="#3B82F6" />
          <Text style={styles.permissionTitle}>Setting up...</Text>
          <Text style={styles.permissionSubtitle}>Please allow camera and microphone access</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <View style={styles.permissionCard}>
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
          <Text style={styles.permissionTitle}>Permissions Required</Text>
          <Text style={styles.permissionSubtitle}>
            Camera and microphone access is needed to submit crop reports
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialIcons name="cloud-upload" size={24} color="#fff" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Upload Crop Query</Text>
          <Text style={styles.headerSubtitle}>ಹೊಸ ಪ್ರಶ್ನೆ</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Description */}
          <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.sectionSubtitle}>ವಿವರಣೆ</Text>
            <TextInput
              mode="outlined"
              placeholder="Describe your crop condition and any concerns..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={styles.textInput}
              outlineColor="#E5E7EB"
              activeOutlineColor="#3B82F6"
            />
          </View>

          {/* Media Upload Cards */}
          <View style={styles.mediaGrid}>
            {/* Photo Card */}
            <View style={styles.mediaCard}>
              <View style={styles.mediaHeader}>
                <MaterialIcons name="photo-camera" size={20} color="#10B981" />
                <Text style={styles.mediaTitle}>Photo</Text>
              </View>

              {!selectedImage ? (
                <View style={styles.uploadArea}>
                  <MaterialIcons name="add-photo-alternate" size={40} color="#9CA3AF" />
                  <Text style={styles.uploadText}>Add crop photo</Text>
                  <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
                      <MaterialIcons name="photo-library" size={16} color="#3B82F6" />
                      <Text style={styles.buttonText}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
                      <MaterialIcons name="camera-alt" size={16} color="#3B82F6" />
                      <Text style={styles.buttonText}>Camera</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.mediaPreview}>
                  <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeButton} onPress={removeImage}>
                    <MaterialIcons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Audio Card */}
            <View style={styles.mediaCard}>
              <View style={styles.mediaHeader}>
                <MaterialIcons name="mic" size={20} color="#F59E0B" />
                <Text style={styles.mediaTitle}>Audio</Text>
              </View>

              {!audioUri ? (
                <View style={styles.uploadArea}>
                  <MaterialIcons
                    name={isRecording ? "mic" : "mic-none"}
                    size={40}
                    color={isRecording ? "#EF4444" : "#9CA3AF"}
                  />
                  <Text style={styles.uploadText}>
                    {isRecording ? 'Recording...' : 'Record voice note'}
                  </Text>
                  <TouchableOpacity
                    style={[styles.recordButton, isRecording && styles.recordingButton]}
                    onPress={isRecording ? stopRecording : startRecording}
                  >
                    <MaterialIcons
                      name={isRecording ? "stop" : "mic"}
                      size={16}
                      color="#fff"
                    />
                    <Text style={styles.recordButtonText}>
                      {isRecording ? 'Stop' : 'Record'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.mediaPreview}>
                  <View style={styles.audioPreview}>
                    <MaterialIcons name="audiotrack" size={32} color="#F59E0B" />
                    <Text style={styles.audioPreviewText}>Audio recorded</Text>
                  </View>
                  <TouchableOpacity style={styles.removeButton} onPress={removeAudio}>
                    <MaterialIcons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Video Card */}
            <View style={styles.mediaCard}>
              <View style={styles.mediaHeader}>
                <MaterialIcons name="videocam" size={20} color="#EF4444" />
                <Text style={styles.mediaTitle}>Video</Text>
              </View>

              {!videoUri ? (
                <View style={styles.uploadArea}>
                  <MaterialIcons name="video-call" size={40} color="#9CA3AF" />
                  <Text style={styles.uploadText}>Record crop video</Text>
                  <TouchableOpacity style={styles.videoButton} onPress={startVideoRecording}>
                    <MaterialIcons name="videocam" size={16} color="#fff" />
                    <Text style={styles.recordButtonText}>Record</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.mediaPreview}>
                  <Video
                    source={{ uri: videoUri }}
                    style={styles.previewVideo}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                  />
                  <TouchableOpacity style={styles.removeButton} onPress={removeVideo}>
                    <MaterialIcons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!description && !selectedImage && !audioUri && !videoUri) && styles.disabledButton
              ]}
              onPress={submitReport}
              disabled={(!description && !selectedImage && !audioUri && !videoUri) || isSubmitting}
            >
              <MaterialIcons name="cloud-upload" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>{isSubmitting ? 'Submitting...' : 'Submit Query'}</Text>
            </TouchableOpacity>
            <Text style={styles.submitHint}>
              Add a description or at least one media file
            </Text>
          </View>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#fff',
    color: '#111',
    fontSize: 14,
  },
  mediaGrid: {
    marginBottom: 24,
  },
  mediaCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mediaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mediaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  uploadArea: {
    alignItems: 'center',
    paddingVertical: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  uploadText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  buttonText: {
    fontSize: 12,
    color: '#3B82F6',
    marginLeft: 4,
    fontWeight: '500',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  recordingButton: {
    backgroundColor: '#EF4444',
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  recordButtonText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },
  mediaPreview: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  previewVideo: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  audioPreview: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
  },
  audioPreviewText: {
    fontSize: 14,
    color: '#D97706',
    marginTop: 8,
    fontWeight: '500',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  submitHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  permissionCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});