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

interface FarmerProfile {
  id: string;
  name: string;
  phoneNumber: string;
  village: string;
  district: string;
  state: string;
  pincode: string;
  registrationDate: string;
  dateOfBirth: string;
  isActive: boolean;
  profilePicture?: string;
}

export default function ProfileScreen() {
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [dbId, setDbId] = useState<number | null>(null);

  const [profile, setProfile] = useState<FarmerProfile>({
    id: 'Loading...',
    name: 'Loading...',
    phoneNumber: 'Loading...',
    village: 'Loading...',
    district: 'Loading...',
    state: 'Loading...',
    pincode: 'Loading...',
    registrationDate: 'Loading...',
    dateOfBirth: 'Loading...',
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
          router.replace('/');
          return;
        }

        // Try to fetch farmer details
        try {
          const res = await axios.get(`${FARMERS_BASE}/farmer-id/${encodeURIComponent(farmerId)}`);
          const farmer = res?.data?.data ?? {};
          
          const picturePath: string | undefined = farmer.profilePicture ?? undefined;
          const pictureUrl = picturePath
            ? (picturePath.startsWith('http') ? picturePath : `${getApiBaseUrl()}/uploads/${picturePath}`)
            : undefined;
            
          const mapped: FarmerProfile = {
            id: farmer.farmerId ?? farmerId,
            name: farmer.fullName ?? 'Not Available',
            phoneNumber: farmer.contactNumber ?? 'Not Available',
            village: farmer.village ?? 'Not Available',
            district: farmer.district ?? 'Not Available',
            state: farmer.state ?? 'Not Available',
            pincode: farmer.pinCode ?? 'Not Available',
            registrationDate: farmer.registrationDate ? new Date(farmer.registrationDate).toISOString().slice(0,10) : 'Not Available',
            dateOfBirth: farmer.dateOfBirth ?? 'Not Available',
            isActive: farmer.isActive ?? true,
            profilePicture: pictureUrl,
          };
          setDbId(farmer.id ?? null);
          setProfile(mapped);
          setEditedProfile(mapped);
        } catch (fetchError) {
          // If API fails, use session data
          console.log('API fetch failed, using session data:', fetchError);
          const mapped: FarmerProfile = {
            id: farmerId,
            name: session?.fullName ?? 'Not Available',
            phoneNumber: session?.contactNumber ?? 'Not Available',
            village: 'Not Available',
            district: 'Not Available',
            state: 'Not Available',
            pincode: 'Not Available',
            registrationDate: 'Not Available',
            dateOfBirth: session?.dateOfBirth ?? 'Not Available',
            isActive: true,
            profilePicture: undefined,
          };
          setProfile(mapped);
          setEditedProfile(mapped);
        }
      } catch (e: any) {
        console.log('Profile load error:', e);
        Alert.alert('Error', 'Failed to load profile. Using basic information.');
        
        // Fallback to basic session data
        const raw = await AsyncStorage.getItem('farmerSession');
        const session = raw ? JSON.parse(raw) : null;
        const farmerId = session?.farmerId ?? 'Unknown';
        
        const fallbackProfile: FarmerProfile = {
          id: farmerId,
          name: session?.fullName ?? 'Not Available',
          phoneNumber: session?.contactNumber ?? 'Not Available',
          village: 'Not Available',
          district: 'Not Available',
          state: 'Not Available',
          pincode: 'Not Available',
          registrationDate: 'Not Available',
          dateOfBirth: session?.dateOfBirth ?? 'Not Available',
          isActive: true,
          profilePicture: undefined,
        };
        setProfile(fallbackProfile);
        setEditedProfile(fallbackProfile);
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
        try {
          const uploadedUrl = await uploadProfilePicture(asset.base64 || '', asset.uri);
          setEditedProfile(prev => ({ ...prev, profilePicture: uploadedUrl }));
          setProfile(prev => ({ ...prev, profilePicture: uploadedUrl }));
          Alert.alert('Success', 'Profile picture updated successfully.');
        } catch {
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
      const returnedPath: string | undefined = json?.data?.profilePicture || json?.profilePicture;
      if (returnedPath) {
        return returnedPath.startsWith('http') ? returnedPath : `${getApiBaseUrl()}/uploads/${returnedPath}`;
      }
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
      if (!dbId) {
        Alert.alert('Error', 'Cannot save profile. Please contact support.');
        return;
      }
      
      let profilePictureUrl = editedProfile.profilePicture;
      if (profilePictureUrl && (profilePictureUrl.startsWith('file://') || profilePictureUrl.startsWith('blob:') || profilePictureUrl.startsWith('data:') )) {
        try {
          profilePictureUrl = await uploadProfilePicture('', profilePictureUrl);
        } catch (error) {
          Alert.alert('Warning', 'Profile updated but failed to upload picture. Please try again.');
        }
      }

      const payload: any = {
        fullName: editedProfile.name,
        village: editedProfile.village === 'Not Available' ? null : editedProfile.village,
        district: editedProfile.district === 'Not Available' ? null : editedProfile.district,
        state: editedProfile.state === 'Not Available' ? null : editedProfile.state,
        pinCode: editedProfile.pincode === 'Not Available' ? null : editedProfile.pincode,
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
    const initials = (editedProfile.name || 'NA').split(' ').map(n => n[0]).join('').toUpperCase();

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
              size={isTablet ? 100 : 70}
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
                <MaterialIcons name="camera-alt" size={20} color="#fff" />
              )}
            </View>
          )}
        </TouchableOpacity>

        {isEditing && hasProfilePicture && (
          <IconButton
            icon="delete"
            size={18}
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
          theme={{ 
            colors: { 
              text: '#000',
              primary: '#388E3C',
              outline: 'rgba(46, 125, 50, 0.3)',
              background: '#fff',
            } 
          }}
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
          <Text style={{ marginTop: 8, color: '#333' }}>Loading profile...</Text>
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
            {renderField('Phone Number', editedProfile.phoneNumber, false)}
            {renderField('Date of Birth', editedProfile.dateOfBirth, false)}
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
  headerContent: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  
  // Profile Picture Styles
  profilePictureContainer: {
    alignItems: 'center',
  },
  profilePictureWrapper: {
    position: 'relative',
    borderRadius: isTablet ? 50 : 35,
    overflow: 'hidden',
  },
  profileImage: {
    width: isTablet ? 100 : 70,
    height: isTablet ? 100 : 70,
    borderRadius: isTablet ? 50 : 35,
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
    borderRadius: isTablet ? 50 : 35,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  changePhotoButton: {
    marginTop: 6,
    paddingVertical: 4,
  },
  changePhotoText: {
    fontSize: 11,
    color: '#1e88e5',
    fontWeight: '500',
    textAlign: 'center',
  },

  avatarLabel: { fontSize: 28, fontWeight: 'bold' },
  nameContainer: { flex: 1 },
  name: { fontSize: isTablet ? 24 : 18, fontWeight: '700', marginBottom: 6, color: '#222' },
  idBadge: { alignSelf: 'flex-start', backgroundColor: '#dceefc', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, marginBottom: 6 },
  idText: { color: '#1e88e5', fontWeight: '600', fontSize: 12 },
  
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
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },

  buttonRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20, gap: 12 },
  editButton: { flex: 1, borderRadius: 12 },
  cancelButton: { flex: 1, borderRadius: 12 },
  saveButton: { flex: 1, borderRadius: 12 },
  card: { marginBottom: 16, borderRadius: 12, elevation: 2 },
  fieldContainer: { marginBottom: 16 },
  fieldLabel: { fontWeight: '600', marginBottom: 8, color: '#333', fontSize: 14 },
  input: { backgroundColor: '#fff' },
  staticValue: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8 },
  staticText: { fontSize: isTablet ? 16 : 14, fontWeight: '500', color: '#222' },
  logoutButton: { marginTop: 24, borderColor: '#f44336', borderWidth: 1, borderRadius: 12, paddingVertical: 6 },
});
