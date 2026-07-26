import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { createPostApi } from '../services/postsApi';
import { getStoredUser } from '../services/authApi';
import { ArrowLeft, Camera, Image as ImageIcon, MapPin, X } from 'lucide-react-native';

export default function CreatePostScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [locationText, setLocationText] = useState('');
  const [tags, setTags] = useState('');
  const [itemType, setItemType] = useState<'LOST' | 'FOUND'>('LOST');
  const [images, setImages] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [buildingName, setBuildingName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can only upload a maximum of 5 images');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
    });

    if (!result.canceled && result.assets) {
      const selectedUris = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...selectedUris].slice(0, 5));
    }
  };

  const capturePhoto = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can only upload a maximum of 5 images');
      return;
    }

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setImages((prev) => [...prev, result.assets[0].uri].slice(0, 5));
    }
  };

  const getCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access GPS location was denied');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);

      // Reverse geocode building / street name
      const reverse = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (reverse && reverse[0]) {
        const place = reverse[0];
        const name = place.name || place.street || place.district || 'Campus GPS Pin';
        setBuildingName(name);
        if (!locationText) setLocationText(name);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to retrieve current GPS location');
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Validation Error', 'Please enter a title and description');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Validation Error', 'Please attach at least 1 image');
      return;
    }

    setSubmitting(true);
    try {
      const storedUser = await getStoredUser();

      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('userId', storedUser?.userId || '1');
      formData.append('item_type', itemType);
      formData.append('status', 'OPEN');
      formData.append('location', locationText);
      formData.append('tags', tags);
      formData.append('scope_id', '0'); // Public scope

      if (latitude !== undefined) formData.append('latitude', String(latitude));
      if (longitude !== undefined) formData.append('longitude', String(longitude));
      if (buildingName) formData.append('building_name', buildingName);

      // Attach image files
      images.forEach((uri, index) => {
        const fileType = uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
        formData.append('images', {
          uri,
          name: `upload_${index}.${fileType === 'image/png' ? 'png' : 'jpg'}`,
          type: fileType,
        } as any);
      });

      await createPostApi(formData);
      Alert.alert('Success', 'Post created successfully!');
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Failed to Create Post', error.response?.data?.error || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New Post</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Item Type Selector */}
          <Text style={styles.label}>Item Type</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeButton, itemType === 'LOST' && styles.typeButtonLost]}
              onPress={() => setItemType('LOST')}
            >
              <Text style={[styles.typeText, itemType === 'LOST' && styles.typeTextActive]}>
                🔴 I Lost an Item
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, itemType === 'FOUND' && styles.typeButtonFound]}
              onPress={() => setItemType('FOUND')}
            >
              <Text style={[styles.typeText, itemType === 'FOUND' && styles.typeTextActive]}>
                🟢 I Found an Item
              </Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={styles.label}>Title *</Text>
          <TextInput
            placeholder="e.g. Lost Silver iPhone 15 Pro near Library"
            placeholderTextColor="#64748b"
            style={styles.input}
            value={title}
            onChangeText={setTitle}
          />

          {/* Description */}
          <Text style={styles.label}>Description *</Text>
          <TextInput
            placeholder="Describe the item, features, where it was lost/found..."
            placeholderTextColor="#64748b"
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            value={content}
            onChangeText={setContent}
          />

          {/* Location & GPS */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>Location / Building</Text>
            <TouchableOpacity
              style={styles.gpsButton}
              onPress={getCurrentLocation}
              disabled={locating}
            >
              <MapPin size={14} color="#f43f5e" />
              <Text style={styles.gpsText}>
                {locating ? 'Acquiring GPS...' : latitude ? '📍 GPS Attached' : 'Get Current GPS'}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            placeholder="e.g. Library 2nd Floor, Engineering Block A"
            placeholderTextColor="#64748b"
            style={styles.input}
            value={locationText}
            onChangeText={setLocationText}
          />

          {/* Image Picker */}
          <Text style={styles.label}>Upload Photos (Min 1, Max 5) *</Text>
          <View style={styles.imageActionRow}>
            <TouchableOpacity style={styles.pickerButton} onPress={pickImage}>
              <ImageIcon size={20} color="#3b82f6" />
              <Text style={styles.pickerText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pickerButton} onPress={capturePhoto}>
              <Camera size={20} color="#3b82f6" />
              <Text style={styles.pickerText}>Camera</Text>
            </TouchableOpacity>
          </View>

          {/* Image Thumbnails */}
          {images.length > 0 && (
            <View style={styles.thumbnailGrid}>
              {images.map((uri, index) => (
                <View key={index} style={styles.thumbnailContainer}>
                  <Image source={{ uri }} style={styles.thumbnail} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <X size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Tags */}
          <Text style={styles.label}>Tags (Optional)</Text>
          <TextInput
            placeholder="e.g. electronics, keys, wallet, red"
            placeholderTextColor="#64748b"
            style={styles.input}
            value={tags}
            onChangeText={setTags}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.buttonDisabled]}
            disabled={submitting}
            onPress={handleSubmit}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitText}>Publish Post</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
    marginTop: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gpsText: {
    fontSize: 12,
    color: '#f43f5e',
    fontWeight: '600',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonLost: {
    backgroundColor: '#dc2626',
    borderColor: '#ef4444',
  },
  typeButtonFound: {
    backgroundColor: '#16a34a',
    borderColor: '#22c55e',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  typeTextActive: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f8fafc',
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  imageActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  pickerText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 14,
  },
  thumbnailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  thumbnailContainer: {
    position: 'relative',
    width: 70,
    height: 70,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
