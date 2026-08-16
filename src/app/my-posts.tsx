import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchMyPosts } from '../services/postsApi';
import { PostUI } from '../types/postTypes';
import { ArrowLeft, MapPin, Search } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';

export default function MyPostsScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams();
  const [posts, setPosts] = useState<PostUI[]>([]);
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    if (from === 'create' || from === 'edit') {
      router.replace('/profile');
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile');
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const mine = await fetchMyPosts();
      setPosts(mine);
    } catch (e) {
      console.log('Error fetching my posts', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderPost = ({ item }: { item: PostUI }) => {
    const isLost = item.itemType === 'LOST';
    return (
      <TouchableOpacity
        style={styles.postCard}
        activeOpacity={0.9}
        onPress={() => router.push(`/post/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, isLost ? styles.lostBadge : styles.foundBadge]}>
            <Text style={[styles.typeBadgeText, isLost ? styles.lostBadgeText : styles.foundBadgeText]}>
              {isLost ? 'LOST' : 'FOUND'}
            </Text>
          </View>
          {!!item.status && (
            <View
              style={[
                styles.statusBadge,
                item.status === 'RESOLVED' ? styles.resolvedBadge : styles.openBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  item.status === 'RESOLVED' ? styles.resolvedText : styles.openText,
                ]}
              >
                {item.status}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.postTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.locationRow}>
          <MapPin size={16} color="#64748b" />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.buildingName || item.location || 'No location specified'}
          </Text>
        </View>

        {item.images && item.images.length > 0 && (
          <Image source={{ uri: item.images[0] }} style={styles.postImage} resizeMode="cover" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={20} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Posts</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlashList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={300}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Search size={48} color="#334155" />
              <Text style={styles.emptyText}>You haven't posted anything yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerSpacer: { width: 40 },
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
    paddingVertical: 10,
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
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  postCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lostBadge: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  foundBadge: { backgroundColor: 'rgba(34, 197, 94, 0.1)' },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  lostBadgeText: { color: '#ef4444' },
  foundBadgeText: { color: '#22c55e' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  openBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  resolvedBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  openText: { color: '#3b82f6' },
  resolvedText: { color: '#94a3b8' },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
    lineHeight: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#94a3b8',
    flex: 1,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
    fontWeight: '500',
  },
});
