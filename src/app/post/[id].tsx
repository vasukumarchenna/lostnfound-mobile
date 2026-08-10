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
import { KeyboardWrapper } from '../../components/KeyboardWrapper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapComponent from '../../components/MapComponent';

import { fetchPostById, fetchPostComments, createPostComment } from '../../services/postsApi';
import { createClaim } from '../../services/claimsApi';
import { getStoredUser } from '../../services/authApi';
import { PostUI, CommentUI } from '../../types/postTypes';
import { formatRelativeTime } from '../../utils/time';
import { ArrowLeft, MapPin, Send, Tag, User, ShieldCheck, X, Edit3 } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface CommentNode extends CommentUI {
  children: CommentNode[];
}

const buildCommentTree = (commentsList: CommentUI[]): CommentNode[] => {
  const commentMap: { [key: string]: CommentNode } = {};
  const roots: CommentNode[] = [];

  commentsList.forEach(c => {
    commentMap[c.commentId] = { ...c, children: [] };
  });

  commentsList.forEach(c => {
    if (c.parentCommentId && commentMap[c.parentCommentId]) {
      commentMap[c.parentCommentId].children.push(commentMap[c.commentId]);
    } else {
      roots.push(commentMap[c.commentId]);
    }
  });

  const sortNodes = (nodes: CommentNode[]) => {
    nodes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    nodes.forEach(n => sortNodes(n.children));
  };
  sortNodes(roots);
  return roots;
};

const CommentItem = ({ node, depth = 0, onReply, renderReplyInput }: { node: CommentNode; depth?: number; onReply: (id: string, name: string) => void, renderReplyInput?: (id: string) => React.ReactNode }) => {
  const maxDepth = 3;
  const currentDepth = Math.min(depth, maxDepth);
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  
  return (
    <View style={{ marginLeft: currentDepth > 0 ? 16 : 0, borderLeftWidth: currentDepth > 0 ? 2 : 0, borderLeftColor: '#334155', paddingLeft: currentDepth > 0 ? 12 : 0, marginTop: currentDepth > 0 ? 8 : 0 }}>
      <View style={styles.commentCard}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{node.userFullName}</Text>
          <Text style={styles.commentDate}>{formatRelativeTime(node.createdAt)}</Text>
        </View>
        <Text style={styles.commentContent}>{node.content}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <TouchableOpacity style={styles.replyButton} onPress={() => onReply(node.commentId, node.userFullName)}>
            <Text style={styles.replyButtonText}>Reply</Text>
          </TouchableOpacity>
          {hasChildren && (
            <TouchableOpacity style={styles.replyButton} onPress={() => setIsExpanded(!isExpanded)}>
              <Text style={[styles.replyButtonText, { color: '#94a3b8' }]}>
                {isExpanded ? 'Hide replies' : `See replies (${node.children.length})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {renderReplyInput && renderReplyInput(node.commentId)}
      {isExpanded && node.children.map(child => (
        <CommentItem key={child.commentId} node={child} depth={depth + 1} onReply={onReply} renderReplyInput={renderReplyInput} />
      ))}
    </View>
  );
};

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [post, setPost] = useState<PostUI | null>(null);
  const [comments, setComments] = useState<CommentUI[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
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
      const created = await createPostComment(id, newComment.trim(), replyingTo?.id);
      setComments((prev) => [...prev, created]);
      setNewComment('');
      setReplyingTo(null);
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
      <KeyboardWrapper type="scrollable" style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {post.title}
          </Text>
          {isOwner ? (
            <TouchableOpacity style={{ width: 40, alignItems: 'center' }} onPress={() => router.push(`/edit-post/${id}` as any)}>
              <Edit3 size={20} color="#f8fafc" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

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
              {post.classificationName && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{post.classificationName}</Text>
                </View>
              )}
            </View>

            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.description}>{post.content}</Text>

            {/* Classification Details */}
            {((post.attributes && Object.keys(post.attributes).length > 0) || post.estimatedBirthYear != null) && (
              <View style={styles.attributesContainer}>
                <Text style={styles.attributesHeader}>Category Details</Text>
                <View style={styles.attributesGrid}>
                  {post.estimatedBirthYear != null && (
                    <View style={styles.attributeChip}>
                      <Text style={styles.attributeKey}>Birth Year:</Text>
                      <Text style={styles.attributeValue}>~{post.estimatedBirthYear}</Text>
                    </View>
                  )}
                  {post.attributes &&
                    Object.entries(post.attributes).map(([key, value]) => (
                      <View key={key} style={styles.attributeChip}>
                        <Text style={styles.attributeKey}>{key.replace(/_/g, ' ')}:</Text>
                        <Text style={styles.attributeValue}>
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            )}

            {/* Author Info */}
            {post.userFullName !== 'Anonymous User' && (
              <View style={styles.authorCard}>
                <User size={18} color="#3b82f6" />
                <Text style={styles.authorName}>Posted by {post.userFullName}</Text>
              </View>
            )}

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
                {post.hasActiveClaim ? (
                  <View style={[styles.claimButton, { backgroundColor: '#475569' }]}>
                    <ShieldCheck size={20} color="#94a3b8" />
                    <Text style={[styles.claimButtonText, { color: '#94a3b8' }]}>Already Claimed</Text>
                  </View>
                ) : !showClaimBox ? (
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

              {/* Add Comment Input (Top-Level) */}
              {!replyingTo && (
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
              )}

              {/* Comment Thread List */}
              {buildCommentTree(comments).map((item) => (
                <CommentItem 
                  key={item.commentId} 
                  node={item} 
                  onReply={(id, name) => {
                    setReplyingTo({ id, name });
                    setNewComment('');
                  }}
                  renderReplyInput={(id) => {
                    if (replyingTo?.id !== id) return null;
                    return (
                      <View style={styles.inlineReplyContainer}>
                        <TextInput
                          placeholder={`Reply to ${replyingTo.name}...`}
                          placeholderTextColor="#64748b"
                          style={styles.inlineReplyInput}
                          value={newComment}
                          onChangeText={setNewComment}
                          autoFocus
                        />
                        <View style={styles.inlineReplyActions}>
                          <TouchableOpacity style={styles.cancelReplyBtn} onPress={() => { setReplyingTo(null); setNewComment(''); }}>
                            <Text style={styles.cancelReplyText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.sendReplyBtn, submittingComment && styles.buttonDisabled]}
                            disabled={submittingComment}
                            onPress={handleAddComment}
                          >
                            {submittingComment ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.sendReplyText}>Send</Text>}
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  }}
                />
              ))}
            </View>
          </View>
      </KeyboardWrapper>
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
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  categoryBadgeText: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: 'bold',
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
  attributesContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  attributesHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 12,
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attributeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  attributeKey: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  attributeValue: {
    fontSize: 13,
    color: '#f8fafc',
    fontWeight: '500',
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
  inlineReplyContainer: {
    marginTop: 8,
    marginLeft: 16,
    padding: 10,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inlineReplyInput: {
    color: '#f8fafc',
    fontSize: 14,
    minHeight: 40,
  },
  inlineReplyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  cancelReplyBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelReplyText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  sendReplyBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  sendReplyText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  commentCard: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#38bdf8',
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
  replyButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  replyButtonText: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '600',
  },
  replyIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  replyIndicatorText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
});
