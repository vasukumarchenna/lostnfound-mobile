import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { fetchPosts } from '../services/postsApi';
import { getStoredUser, logoutApi, UserAuthData } from '../services/authApi';
import { PostUI } from '../types/postTypes';
import { Search, MapPin, Plus, LogOut, ShieldCheck, Tag, Filter } from 'lucide-react-native';

export default function FeedScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<UserAuthData | null>(null);

  const loadData = useCallback(async () => {
    try {
      const stored = await getStoredUser();
      if (!stored || !stored.token) {
        router.replace('/auth/login');
        return;
      }
      setUser(stored);

      const params: any = {};
      if (filterType !== 'ALL') params.item_type = filterType;
      if (searchQuery.trim()) params.query = searchQuery.trim();

      const data = await fetchPosts(params);
      setPosts(data);
    } catch (e: any) {
      console.warn('Failed to load posts', e);
      if (e?.response?.status === 401) {
        router.replace('/auth/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterType, searchQuery, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = async () => {
    await logoutApi();
    router.replace('/auth/login');
  };

  const renderPostItem = ({ item }: { item: PostUI }) => {
    const isFound = item.itemType === 'FOUND';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push(`/post/${item.id}`)}
      >
        {/* Post Image Thumbnail */}
        {item.images.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImagePlaceholder, isFound ? styles.bgFound : styles.bgLost]}>
            <Tag size={32} color="#ffffff" />
          </View>
        )}

        <View style={styles.cardContent}>
          {/* Header Badge */}
          <View style={styles.badgeRow}>
            <View style={[styles.typeBadge, isFound ? styles.badgeFound : styles.badgeLost]}>
              <Text style={styles.typeBadgeText}>{item.itemType}</Text>
            </View>

            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{item.status}</Text>
            </View>
          </View>

          {/* Title & Description */}
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.content}
          </Text>

          {/* Location & Building Pin */}
          {(item.location || item.buildingName) && (
            <View style={styles.locationRow}>
              <MapPin size={14} color="#f43f5e" />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.buildingName || item.location}
              </Text>
            </View>
          )}

          {/* Author Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.authorText}>By {item.userFullName}</Text>
            <Text style={styles.dateText}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconBadge}>
              <ShieldCheck size={22} color="#3b82f6" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Lost & Found</Text>
              <Text style={styles.headerSubtitle}>Campus Feed</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/claims')}>
              <Tag size={20} color="#f8fafc" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
              <LogOut size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            placeholder="Search items, keywords, locations..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={loadData}
          />
        </View>

        {/* Category Filter Chips */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'ALL' && styles.filterChipActive]}
            onPress={() => setFilterType('ALL')}
          >
            <Text style={[styles.filterChipText, filterType === 'ALL' && styles.filterChipTextActive]}>
              All Posts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterType === 'LOST' && styles.filterChipActiveLost]}
            onPress={() => setFilterType('LOST')}
          >
            <Text style={[styles.filterChipText, filterType === 'LOST' && styles.filterChipTextActive]}>
              🔴 Lost
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterType === 'FOUND' && styles.filterChipActiveFound]}
            onPress={() => setFilterType('FOUND')}
          >
            <Text style={[styles.filterChipText, filterType === 'FOUND' && styles.filterChipTextActive]}>
              🟢 Found
            </Text>
          </TouchableOpacity>
        </View>

        {/* Posts List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={renderPostItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Tag size={48} color="#475569" />
                <Text style={styles.emptyTitle}>No posts found</Text>
                <Text style={styles.emptySubtitle}>Be the first to create a post!</Text>
              </View>
            }
          />
        )}

        {/* Floating Action Button (Create Post) */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => router.push('/create')}
        >
          <Plus size={28} color="#ffffff" />
        </TouchableOpacity>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  filterChipActiveLost: {
    backgroundColor: '#dc2626',
    borderColor: '#ef4444',
  },
  filterChipActiveFound: {
    backgroundColor: '#16a34a',
    borderColor: '#22c55e',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94a3b8',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgLost: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  bgFound: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  cardContent: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeLost: {
    backgroundColor: '#ef4444',
  },
  badgeFound: {
    backgroundColor: '#22c55e',
  },
  typeBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  statusBadgeText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  locationText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
    marginTop: 4,
  },
  authorText: {
    fontSize: 12,
    color: '#64748b',
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
