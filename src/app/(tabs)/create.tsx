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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { createPostApi } from '../../services/postsApi';
import { getStoredUser } from '../../services/authApi';
import { fetchClassificationTree, ClassificationTreeItem, ClassificationAttribute } from '../../services/classificationsApi';
import MapComponent from '../../components/MapComponent';
import { ArrowLeft, Camera, Image as ImageIcon, MapPin, X, ChevronRight } from 'lucide-react-native';

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

  // Classification State
  const [classificationTree, setClassificationTree] = useState<ClassificationTreeItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [loadingCategories, setLoadingCategories] = useState(true);

  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        const tree = await fetchClassificationTree();
        setClassificationTree(tree);
      } catch (e) {
        console.warn('Failed to load categories', e);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  const selectedCategory = classificationTree.find(c => c.classification_id === selectedCategoryId);
  const subcategories = selectedCategory?.children || [];
  const selectedSubcategory = subcategories.find(c => c.classification_id === selectedSubcategoryId);
  
  const activeCategory = selectedSubcategory || selectedCategory;
  const activeAttributes = activeCategory?.attributes || [];

  const handleAttributeChange = (attrName: string, value: any) => {
    setAttributes((prev) => ({ ...prev, [attrName]: value }));
  };

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

      if (activeCategory) {
        formData.append('classification_id', String(activeCategory.classification_id));
      }
      
      if (Object.keys(attributes).length > 0) {
        formData.append('attributes', JSON.stringify(attributes));
      }

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
    <>
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

          {/* Classification / Category Selection */}
          <Text style={styles.label}>Category</Text>
          {loadingCategories ? (
            <ActivityIndicator color="#3b82f6" style={{ alignSelf: 'flex-start', marginTop: 10 }} />
          ) : (
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                {classificationTree.map((cat) => (
                  <TouchableOpacity
                    key={cat.classification_id}
                    style={[styles.catChip, selectedCategoryId === cat.classification_id && styles.catChipActive]}
                    onPress={() => {
                      setSelectedCategoryId(cat.classification_id);
                      setSelectedSubcategoryId(null);
                      setAttributes({});
                    }}
                  >
                    <Text style={[styles.catChipText, selectedCategoryId === cat.classification_id && styles.catChipTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {subcategories.length > 0 && (
                <View style={styles.subcategoryBox}>
                  <Text style={styles.subcatLabel}>Subcategory:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                    {subcategories.map((sub) => (
                      <TouchableOpacity
                        key={sub.classification_id}
                        style={[styles.subcatChip, selectedSubcategoryId === sub.classification_id && styles.subcatChipActive]}
                        onPress={() => {
                          setSelectedSubcategoryId(sub.classification_id);
                          setAttributes({});
                        }}
                      >
                        <Text style={[styles.subcatChipText, selectedSubcategoryId === sub.classification_id && styles.subcatChipTextActive]}>
                          {sub.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {/* Dynamic Attributes */}
          {activeAttributes.length > 0 && (
            <View style={styles.attributesContainer}>
              <Text style={styles.attributesHeader}>Item Details</Text>
              {activeAttributes.map((attr) => (
                <View key={attr.attribute_id} style={styles.attrInputBox}>
                  <Text style={styles.attrLabel}>{attr.name} {attr.is_required ? '*' : ''}</Text>
                  {attr.data_type === 'BOOLEAN' ? (
                    <View style={styles.typeRow}>
                      <TouchableOpacity
                        style={[styles.typeButton, attributes[attr.name] === true && styles.attrBoolActive]}
                        onPress={() => handleAttributeChange(attr.name, true)}
                      >
                        <Text style={[styles.typeText, attributes[attr.name] === true && styles.catChipTextActive]}>Yes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.typeButton, attributes[attr.name] === false && styles.attrBoolActive]}
                        onPress={() => handleAttributeChange(attr.name, false)}
                      >
                        <Text style={[styles.typeText, attributes[attr.name] === false && styles.catChipTextActive]}>No</Text>
                      </TouchableOpacity>
                    </View>
                  ) : attr.options && attr.options.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                      {attr.options.map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.subcatChip, attributes[attr.name] === opt && styles.subcatChipActive]}
                          onPress={() => handleAttributeChange(attr.name, opt)}
                        >
                          <Text style={[styles.subcatChipText, attributes[attr.name] === opt && styles.subcatChipTextActive]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <TextInput
                      placeholder={`Enter ${attr.name.toLowerCase()}`}
                      placeholderTextColor="#64748b"
                      style={styles.input}
                      value={attributes[attr.name] || ''}
                      onChangeText={(val) => handleAttributeChange(attr.name, val)}
                      keyboardType={attr.data_type === 'NUMBER' ? 'numeric' : 'default'}
                    />
                  )}
                </View>
              ))}
            </View>
          )}

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
                {locating ? 'Acquiring GPS...' : 'My Location'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.mapWrapper}>
            <MapComponent
              style={styles.mapView}
              initialRegion={{
                latitude: latitude || 37.78825,
                longitude: longitude || -122.4324,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              region={latitude && longitude ? {
                latitude,
                longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              } : undefined}
              onPress={(e) => {
                setLatitude(e.nativeEvent.coordinate.latitude);
                setLongitude(e.nativeEvent.coordinate.longitude);
              }}
              markers={latitude && longitude ? [{
                latitude,
                longitude,
                title: 'Selected Location',
                pinColor: itemType === 'FOUND' ? 'green' : 'red',
              }] : []}
            />
            <Text style={styles.mapHelpText}>Tap on the map to pinpoint the exact location.</Text>
          </View>

          <TextInput
            placeholder="e.g. Library 2nd Floor, Engineering Block A"
            placeholderTextColor="#64748b"
            style={[styles.input, { marginTop: 10 }]}
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
    </>
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
  mapWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
  },
  mapView: {
    width: '100%',
    height: 200,
  },
  mapHelpText: {
    fontSize: 12,
    color: '#94a3b8',
    padding: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  categoryScroll: {
    paddingVertical: 8,
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  catChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  catChipText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  catChipTextActive: {
    color: '#ffffff',
  },
  subcategoryBox: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  subcatLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  subcatChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  subcatChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#60a5fa',
  },
  subcatChipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  subcatChipTextActive: {
    color: '#ffffff',
  },
  attributesContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  attributesHeader: {
    color: '#38bdf8',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  attrInputBox: {
    marginBottom: 12,
  },
  attrLabel: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 6,
    fontWeight: '500',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  typeText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  attrBoolActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#60a5fa',
  },
});
