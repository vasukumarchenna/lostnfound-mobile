import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapComponent from '../../components/MapComponent';

import { fetchPostById, fetchPostComments, createPostComment } from '../../services/postsApi';
import { createClaim } from '../../services/claimsApi';
import { getStoredUser } from '../../services/authApi';
import { PostUI, CommentUI } from '../../types/postTypes';
import { ArrowLeft, MapPin, Send, Tag, User, ShieldCheck } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [post, setPost] = useState<PostUI | null>(null);
  const [comments, setComments] = useState<CommentUI[]>([]);
  const [newComment, setNewComment] = useState('');
  const [claimMessage, setClaimMessage] = useState('');
  const [showClaimBox, setShowClaimBox] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadPostData = async () => {
      try {
        const stored = await getStoredUser();
        if (stored) setCurrentUserId(stored.userId);

        if (id) {
          const postData = await fetchPostById(id);
          setPost(postData);

          const commentData = await fetchPostComments(id);
          setComments(commentData);
        }
      } catch (e) {
        Alert.alert('Error', 'Failed to load post details');
      } finally {
        setLoading(false);
      }
    };
    loadPostData();
  }, [id]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !id) return;
    setSubmittingComment(true);
    try {
      const created = await createPostComment(id, newComment.trim());
      setComments((prev) => [created, ...prev]);
      setNewComment('');
    } catch (e) {
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (!claimMessage.trim() || !id) {
      Alert.alert('Error', 'Please describe why this item belongs to you');
      return;
    }

    if (post && post.userId === currentUserId) {
      Alert.alert('Action Restricted', 'You cannot claim an item from your own post');
      return;
    }

    setSubmittingClaim(true);
    try {
      await createClaim(id, claimMessage.trim());
      Alert.alert('Claim Submitted', 'Your claim has been submitted to the post owner!');
      setShowClaimBox(false);
      setClaimMessage('');
    } catch (error: any) {
      Alert.alert('Claim Failed', error.response?.data?.error || error.message);
    } finally {
      setSubmittingClaim(false);
    }
  };

  if (loading || !post) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const isFound = post.itemType === 'FOUND';
  const isOwner = post.userId === currentUserId;

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {post.title}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Main Carousel / Images */}
          {post.images.length > 0 && (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.carousel}>
              {post.images.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.carouselImage} resizeMode="cover" />
              ))}
            </ScrollView>
          )}

          {/* Badge & Title Section */}
          <View style={styles.contentSection}>
            <View style={styles.badgeRow}>
              <View style={[styles.typeBadge, isFound ? styles.badgeFound : styles.badgeLost]}>
                <Text style={styles.typeBadgeText}>{post.itemType}</Text>
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{post.status}</Text>
              </View>
            </View>

            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.description}>{post.content}</Text>

            {/* Author Info */}
            <View style={styles.authorCard}>
              <User size={18} color="#3b82f6" />
              <Text style={styles.authorName}>Posted by {post.userFullName}</Text>
            </View>

            {/* Location & Native Map View */}
            {post.latitude != null && post.longitude != null && (
              <View style={styles.mapContainer}>
                <View style={styles.mapHeader}>
                  <MapPin size={16} color="#f43f5e" />
                  <Text style={styles.mapTitle}>
                    {post.buildingName || post.location || 'Pinpointed Campus Location'}
                  </Text>
                </View>

                <MapComponent
                  style={styles.map}
                  initialRegion={{
                    latitude: post.latitude,
                    longitude: post.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  markers={[
                    {
                      latitude: post.latitude,
                      longitude: post.longitude,
                      title: post.buildingName || 'Item Pinpoint',
                      pinColor: isFound ? 'green' : 'red',
                    },
                  ]}
                />
              </View>
            )}

            {/* Claim Action Box */}
            {isFound && !isOwner && post.status === 'OPEN' && (
              <View style={styles.claimSection}>
                {!showClaimBox ? (
                  <TouchableOpacity
                    style={styles.claimButton}
                    onPress={() => setShowClaimBox(true)}
                  >
                    <ShieldCheck size={20} color="#ffffff" />
                    <Text style={styles.claimButtonText}>Claim This Item</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.claimBox}>
                    <Text style={styles.claimBoxTitle}>Submit Claim Request</Text>
                    <TextInput
                      placeholder="Describe proof of ownership (e.g., serial number, distinctive scratch, contents)..."
                      placeholderTextColor="#64748b"
                      style={styles.claimInput}
                      multiline
                      numberOfLines={3}
                      value={claimMessage}
                      onChangeText={setClaimMessage}
                    />

                    <View style={styles.claimActionRow}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowClaimBox(false)}
                      >
                        <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.submitClaimButton, submittingClaim && styles.buttonDisabled]}
                        disabled={submittingClaim}
                        onPress={handleSubmitClaim}
                      >
                        {submittingClaim ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <Text style={styles.submitClaimText}>Submit Claim</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Comment Section */}
            <View style={styles.commentSection}>
              <Text style={styles.commentHeaderTitle}>Comments ({comments.length})</Text>

              {/* Add Comment Input */}
              <View style={styles.commentInputRow}>
                <TextInput
                  placeholder="Write a comment..."
                  placeholderTextColor="#64748b"
                  style={styles.commentInput}
                  value={newComment}
                  onChangeText={setNewComment}
                />

                <TouchableOpacity
                  style={[styles.sendButton, submittingComment && styles.buttonDisabled]}
                  disabled={submittingComment}
                  onPress={handleAddComment}
                >
                  <Send size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {/* Comment Thread List */}
              {comments.map((item) => (
                <View key={item.commentId} style={styles.commentCard}>
                  <Text style={styles.commentAuthor}>{item.userFullName}</Text>
                  <Text style={styles.commentContent}>{item.content}</Text>
                  <Text style={styles.commentDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
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
  centerContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
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
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginHorizontal: 10,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  carousel: {
    width: width,
    height: 240,
  },
  carouselImage: {
    width: width,
    height: 240,
  },
  contentSection: {
    padding: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
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
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
  },
  statusBadgeText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 22,
    marginBottom: 16,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  authorName: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  mapContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
  },
  mapTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
  },
  map: {
    width: '100%',
    height: 180,
  },
  claimSection: {
    marginBottom: 24,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    height: 50,
    borderRadius: 14,
  },
  claimButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  claimBox: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  claimBoxTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 10,
  },
  claimInput: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f8fafc',
    padding: 12,
    height: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 12,
  },
  claimActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  submitClaimButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitClaimText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  commentSection: {
    marginTop: 10,
  },
  commentHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 12,
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f8fafc',
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  commentCard: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 2,
  },
  commentContent: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 18,
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 11,
    color: '#64748b',
  },
});
