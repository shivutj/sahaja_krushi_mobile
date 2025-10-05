import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions, Platform, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { Text, Card, TextInput, Button, Avatar, useTheme, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FARMERS_BASE, getApiBaseUrl } from './config/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth > 768;
const isLandscape = screenWidth > screenHeight;

interface FarmerProfile {
  id: string; // farmerId to display (e.g., FARMER-2025-001)
  name: string;
  phoneNumber: string;
  village: string;
  district: string;
  state: string;
  pincode: string;
  registrationDate: string;
  dateOfBirth: string; // YYYY-MM-DD
  isActive: boolean;
  profilePicture?: string; // URL or base64 string
}

export default function ProfileScreen() {
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [dbId, setDbId] = useState<number | null>(null); // numeric DB id for PUT

  const [profile, setProfile] = useState<FarmerProfile>({
    id: '-',
    name: '-',
    phoneNumber: '-',
    village: '-',
    district: '-',
    state: '-',
    pincode: '-',
    registrationDate: '-',
    dateOfBirth: '-',
    isActive: true,
    profilePicture: undefined,
  });

  const [editedProfile, setEditedProfile] = useState<FarmerProfile>(profile);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const raw = await AsyncStorage.getItem('farmerSession');
        const session = raw ? JSON.parse(raw) : null;
        const farmerId: string | undefined = session?.farmerId;
        if (!farmerId) {
          Alert.alert('Not logged in', 'Please login again to view profile.');
          setIsLoading(false);
          return;
        }
        // Fetch full farmer details by farmerId
        const res = await axios.get(`${FARMERS_BASE}/farmer-id/${encodeURIComponent(farmerId)}`);
        const farmer = res?.data?.data ?? {};
        // Map backend fields to profile
        const picturePath: string | undefined = farmer.profilePicture ?? undefined;
        const pictureUrl = picturePath
          ? (picturePath.startsWith('http') ? picturePath : `${getApiBaseUrl()}/uploads/${picturePath}`)
          : undefined;
        const mapped: FarmerProfile = {
          id: farmer.farmerId ?? farmerId,
          name: farmer.fullName ?? '-',
          phoneNumber: farmer.contactNumber ?? '-',
          village: farmer.village ?? '-',
          district: farmer.district ?? '-',
          state: farmer.state ?? '-',
          pincode: farmer.pinCode ?? '-',
          registrationDate: farmer.registrationDate ? new Date(farmer.registrationDate).toISOString().slice(0,10) : '-',
          dateOfBirth: farmer.dateOfBirth ?? '-',
          isActive: farmer.isActive ?? true,
          profilePicture: pictureUrl,
        };
        setDbId(farmer.id ?? null);
        setProfile(mapped);
        setEditedProfile(mapped);
      } catch (e: any) {
        Alert.alert('Error', 'Failed to load profile.');
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const requestImagePermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to select profile pictures.');
      return false;
    }
    return true;
  };

  const selectImage = async () => {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Select Profile Picture',
      'Choose how you want to select your profile picture',
      [
        { text: 'Camera', onPress: () => openImagePicker('camera') },
        { text: 'Gallery', onPress: () => openImagePicker('gallery') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const openImagePicker = async (source: 'camera' | 'gallery') => {
    try {
      setIsUploadingImage(true);
      let result;

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is required to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          base64: true,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          base64: true,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Upload immediately and update UI on success
        try {
          const uploadedUrl = await uploadProfilePicture(asset.base64 || '', asset.uri);
          setEditedProfile(prev => ({ ...prev, profilePicture: uploadedUrl }));
          setProfile(prev => ({ ...prev, profilePicture: uploadedUrl }));
          Alert.alert('Success', 'Profile picture updated successfully.');
        } catch {
          // Fallback to local preview if upload failed
          setEditedProfile(prev => ({ ...prev, profilePicture: asset.uri }));
          Alert.alert('Warning', 'Failed to upload image. Showing local preview. Try saving again.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const uploadProfilePicture = async (base64: string, uri: string) => {
    try {
      if (!dbId) throw new Error('Missing farmer id');
      
      const formData = new FormData();
      const name = `profile_${Date.now()}.jpg`;
      if (Platform.OS === 'web') {
        const res = await fetch(uri);
        const blob = await res.blob();
        // @ts-ignore File exists on web
        const file = new File([blob], name, { type: blob.type || 'image/jpeg' });
        formData.append('profilePicture', file as any);
      } else {
        formData.append('profilePicture', { uri, name, type: 'image/jpeg' } as any);
      }

      const resp = await fetch(`${FARMERS_BASE}/${dbId}/profile-picture`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });
      const json = await resp.json().catch(() => ({} as any));
      // Expect server to return { data: { profilePicture: 'filename.jpg' } } or similar
      const returnedPath: string | undefined = json?.data?.profilePicture || json?.profilePicture;
      if (returnedPath) {
        return returnedPath.startsWith('http') ? returnedPath : `${getApiBaseUrl()}/uploads/${returnedPath}`;
      }
      // Fallback to existing uri if server didn't echo
      return uri;
    } catch (error) {
      throw new Error('Failed to upload profile picture');
    }
  };

  const removeProfilePicture = () => {
    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => setEditedProfile({ ...editedProfile, profilePicture: undefined })
        }
      ]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!dbId) throw new Error('Missing farmer id');
      
      // Upload profile picture if it's been changed and is a local URI
      let profilePictureUrl = editedProfile.profilePicture;
      // If local file (native) or blob/web uri, attempt upload
      if (profilePictureUrl && (profilePictureUrl.startsWith('file://') || profilePictureUrl.startsWith('blob:') || profilePictureUrl.startsWith('data:') )) {
        try {
          profilePictureUrl = await uploadProfilePicture('', profilePictureUrl);
        } catch (error) {
          Alert.alert('Warning', 'Profile updated but failed to upload picture. Please try again.');
        }
      }

      // Only send editable fields
      const payload: any = {
        fullName: editedProfile.name,
        village: editedProfile.village === '-' ? null : editedProfile.village,
        district: editedProfile.district === '-' ? null : editedProfile.district,
        state: editedProfile.state === '-' ? null : editedProfile.state,
        pinCode: editedProfile.pincode === '-' ? null : editedProfile.pincode,
        // Send relative path if the server expects it; otherwise URL is okay.
        profilePicture: profilePictureUrl,
      };
      
      await axios.put(`${FARMERS_BASE}/${dbId}`, payload);
      
      const updatedProfile = { ...editedProfile, profilePicture: profilePictureUrl };
      setProfile(updatedProfile);
      setEditedProfile(updatedProfile);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully! / ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!');
    } catch {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('farmerSession');
    } catch {}
    Alert.alert('Logged out', 'Redirecting to login...');
    router.replace('/');
  };

  const renderProfilePicture = () => {
    const hasProfilePicture = editedProfile.profilePicture;
    const initials = (editedProfile.name || '-').split(' ').map(n => n[0]).join('');

    return (
      <View style={styles.profilePictureContainer}>
        <TouchableOpacity 
          onPress={isEditing ? selectImage : undefined}
          style={styles.profilePictureWrapper}
          disabled={isUploadingImage}
        >
          {hasProfilePicture ? (
            <Image 
              source={{ uri: editedProfile.profilePicture }} 
              style={styles.profileImage}
            />
          ) : (
            <Avatar.Text
              size={isTablet ? 120 : 80}
              label={initials}
              style={{ backgroundColor: editedProfile.isActive ? '#4CAF50' : '#757575' }}
              labelStyle={styles.avatarLabel}
            />
          )}
          
          {isEditing && (
            <View style={styles.profilePictureOverlay}>
              {isUploadingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="camera-alt" size={24} color="#fff" />
              )}
            </View>
          )}
        </TouchableOpacity>

        {isEditing && hasProfilePicture && (
          <IconButton
            icon="delete"
            size={20}
            iconColor="#f44336"
            style={styles.removeButton}
            onPress={removeProfilePicture}
          />
        )}

        {isEditing && (
          <TouchableOpacity onPress={selectImage} style={styles.changePhotoButton}>
            <Text style={styles.changePhotoText}>
              {hasProfilePicture ? 'Change Photo' : 'Add Photo'} / 
              {hasProfilePicture ? ' ಫೋಟೋ ಬದಲಿಸಿ' : ' ಫೋಟೋ ಸೇರಿಸಿ'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderField = (
    label: string,
    value: string,
    editable = false,
    onChange?: (text: string) => void,
    keyboardType: 'default' | 'phone-pad' | 'numeric' = 'default'
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editable ? (
        <TextInput
          mode="outlined"
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          style={styles.input}
        />
      ) : (
        <View style={styles.staticValue}>
          <Text style={styles.staticText}>{value}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={{ marginTop: 8 }}>Loading profile...</Text>
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={Platform.OS === 'ios'}>
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            {renderProfilePicture()}
            
            <View style={styles.nameContainer}>
              <Text style={styles.name}>{profile.name}</Text>
              <View style={styles.idBadge}>
                <Text style={styles.idText}>ID: {profile.id}</Text>
              </View>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusIndicator, 
                  { backgroundColor: profile.isActive ? '#4CAF50' : '#757575' }
                ]} />
                <Text style={styles.statusText}>
                  {profile.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.buttonRow}>
          {!isEditing ? (
            <Button mode="contained" icon="pencil" onPress={() => setIsEditing(true)} style={styles.editButton}>
              Edit Profile / ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ
            </Button>
          ) : (
            <>
              <Button mode="outlined" onPress={handleCancel} disabled={isSaving} style={styles.cancelButton}>
                Cancel / ರದ್ದುಮಾಡಿ
              </Button>
              <Button mode="contained" icon="content-save" onPress={handleSave} loading={isSaving} disabled={isSaving} style={styles.saveButton}>
                Save / ಉಳಿಸಿ
              </Button>
            </>
          )}
        </View>

        <Card style={styles.card}>
          <Card.Title title="Personal Information" />
          <Card.Content>
            {/* Non-editable fields */}
            {renderField('Phone Number', editedProfile.phoneNumber, false)}
            {renderField('Date of Birth', editedProfile.dateOfBirth, false)}
            {/* Editable fields */}
            {renderField('Full Name', editedProfile.name, isEditing,
              text => setEditedProfile({ ...editedProfile, name: text }))}
            {renderField('Village', editedProfile.village, isEditing,
              text => setEditedProfile({ ...editedProfile, village: text }))}
            {renderField('District', editedProfile.district, isEditing,
              text => setEditedProfile({ ...editedProfile, district: text }))}
            {renderField('State', editedProfile.state, isEditing,
              text => setEditedProfile({ ...editedProfile, state: text }))}
            {renderField('Pincode', editedProfile.pincode, isEditing,
              text => setEditedProfile({ ...editedProfile, pincode: text }), 'numeric')}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Account Information" />
          <Card.Content>
            {renderField('Registration Date', profile.registrationDate)}
            {renderField('Status', profile.isActive ? 'Active' : 'Inactive')}
          </Card.Content>
        </Card>

        <Button mode="outlined" icon="logout" onPress={handleLogout} style={styles.logoutButton}>
          Logout / ಲಾಗ್ ಔಟ್
        </Button>
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 16, paddingBottom: 32, maxWidth: 900, alignSelf: 'center' },
  headerCard: { elevation: 4, borderRadius: 14, marginBottom: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', padding: 24, gap: 20 },
  
  // Profile Picture Styles
  profilePictureContainer: {
    alignItems: 'center',
  },
  profilePictureWrapper: {
    position: 'relative',
    borderRadius: isTablet ? 60 : 40,
    overflow: 'hidden',
  },
  profileImage: {
    width: isTablet ? 120 : 80,
    height: isTablet ? 120 : 80,
    borderRadius: isTablet ? 60 : 40,
  },
  profilePictureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: isTablet ? 60 : 40,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 15,
    elevation: 2,
  },
  changePhotoButton: {
    marginTop: 8,
    paddingVertical: 4,
  },
  changePhotoText: {
    fontSize: 12,
    color: '#1e88e5',
    fontWeight: '500',
    textAlign: 'center',
  },

  avatarLabel: { fontSize: 36, fontWeight: 'bold' },
  nameContainer: { flex: 1 },
  name: { fontSize: isTablet ? 28 : 22, fontWeight: '700', marginBottom: 6, color: '#222' },
  idBadge: { alignSelf: 'flex-start', backgroundColor: '#dceefc', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 8 },
  idText: { color: '#1e88e5', fontWeight: '600' },
  
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },

  buttonRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20, gap: 12 },
  editButton: { flex: 1, borderRadius: 12 },
  cancelButton: { flex: 1, borderRadius: 12 },
  saveButton: { flex: 1, borderRadius: 12 },
  card: { marginBottom: 16, borderRadius: 12, elevation: 2 },
  fieldContainer: { marginBottom: 16 },
  fieldLabel: { fontWeight: '600', marginBottom: 8, color: '#333' },
  input: { backgroundColor: '#fff' },
  staticValue: { backgroundColor: '#f3f4f6', padding: 14, borderRadius: 8 },
  staticText: { fontSize: isTablet ? 18 : 16, fontWeight: '500', color: '#222' },
  logoutButton: { marginTop: 24, borderColor: '#f44336', borderWidth: 1, borderRadius: 12, paddingVertical: 6 },
});