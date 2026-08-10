import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { ChevronDown, Check, X } from 'lucide-react-native';
import { ClassificationTreeItem } from '../services/classificationsApi';

interface CategoryPickerProps {
  categories: ClassificationTreeItem[];
  loading: boolean;
  selectedCategoryId: number | null;
  selectedSubcategoryId: number | null;
  onSelectCategory: (categoryId: number) => void;
  onSelectSubcategory: (subcategoryId: number | null) => void;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  categories,
  loading,
  selectedCategoryId,
  selectedSubcategoryId,
  onSelectCategory,
  onSelectSubcategory,
}) => {
  const [modalType, setModalType] = useState<'category' | 'subcategory' | null>(null);

  const selectedCategory = categories.find((c) => c.classification_id === selectedCategoryId);
  const subcategories = selectedCategory?.children || [];
  const selectedSubcategory = subcategories.find((c) => c.classification_id === selectedSubcategoryId);

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Root Category Dropdown */}
      <Text style={styles.label}>Category</Text>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setModalType('category')}
        activeOpacity={0.7}
      >
        <Text style={[styles.dropdownValue, !selectedCategory && styles.placeholderText]}>
          {selectedCategory ? selectedCategory.name : 'Select Category...'}
        </Text>
        <ChevronDown size={20} color="#94a3b8" />
      </TouchableOpacity>

      {/* Subcategory Dropdown (Loaded when selected category has subcategories) */}
      {selectedCategory && subcategories.length > 0 && (
        <View style={styles.subContainer}>
          <Text style={styles.label}>Subcategory</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setModalType('subcategory')}
            activeOpacity={0.7}
          >
            <Text style={[styles.dropdownValue, !selectedSubcategory && styles.placeholderText]}>
              {selectedSubcategory ? selectedSubcategory.name : 'Select Subcategory...'}
            </Text>
            <ChevronDown size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      )}

      {/* Dropdown Modal Selection */}
      <Modal
        visible={modalType !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalType(null)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'category' ? 'Select Category' : `Subcategory for ${selectedCategory?.name}`}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalType(null)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={modalType === 'category' ? categories : subcategories}
              keyExtractor={(item) => String(item.classification_id)}
              renderItem={({ item }) => {
                const isSelected =
                  modalType === 'category'
                    ? selectedCategoryId === item.classification_id
                    : selectedSubcategoryId === item.classification_id;

                return (
                  <TouchableOpacity
                    style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                    onPress={() => {
                      if (modalType === 'category') {
                        onSelectCategory(item.classification_id);
                        onSelectSubcategory(null);
                      } else {
                        onSelectSubcategory(item.classification_id);
                      }
                      setModalType(null);
                    }}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {item.name}
                    </Text>
                    {isSelected && <Check size={18} color="#3b82f6" />}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  subContainer: {
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownValue: {
    fontSize: 15,
    color: '#f8fafc',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#64748b',
    fontWeight: '400',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#94a3b8',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  closeButton: {
    padding: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  optionItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  optionText: {
    fontSize: 15,
    color: '#cbd5e1',
  },
  optionTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#334155',
  },
});
