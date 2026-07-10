'use client';

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, MessageSquare, Bookmark, AlertTriangle, Edit3, Trash2, Globe, Users, Lock, Share2, X } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useFeedStore } from '../store/feedStore';
import { toast } from '../utils/toast';
import PostComments from './PostComments';
import OptimizedAvatar from './OptimizedAvatar';
import PostMedia from './PostMedia';
import SharePostModal from './SharePostModal';
import PostPoll from './PostPoll';

interface PostCardProps {
  post: any;
}

const PostCard = memo(PostCardComponent);

export default PostCard;

const REACTION_EMOJI: Record<string, string> = {
  LIKE: '👍',
  LOVE: '❤️',
  HAHA: '😆',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😡',
};

const CONTENT_CHAR_LIMIT = 250;

const REACTIONS_LIST = [
  { type: 'LIKE', label: '👍 Thích', color: 'text-[#1877f2]' },
  { type: 'LOVE', label: '❤️ Yêu thích', color: 'text-red-500' },
  { type: 'HAHA', label: '😆 Haha', color: 'text-amber-500' },
  { type: 'WOW', label: '😮 Wow', color: 'text-amber-500' },
  { type: 'SAD', label: '😢 Buồn', color: 'text-blue-500' },
  { type: 'ANGRY', label: '😡 Phẫn nộ', color: 'text-orange-600' },
] as const;

const getReactionStyle = (type: string | null) => {
  switch (type) {
    case 'LOVE': return 'text-red-500 font-bold';
    case 'HAHA': return 'text-amber-500 font-bold';
    case 'WOW': return 'text-amber-500 font-bold';
    case 'SAD': return 'text-blue-500 font-bold';
    case 'ANGRY': return 'text-orange-600 font-bold';
    default: return 'text-[#1877f2] font-bold';
  }
};

const getPrivacyIcon = (privacy: string) => {
  switch (privacy) {
    case 'FRIENDS': return <Users className="w-3 h-3 text-slate-500 inline ml-1" />;
    case 'ONLY_ME': return <Lock className="w-3 h-3 text-slate-500 inline ml-1" />;
    default: return <Globe className="w-3 h-3 text-slate-500 inline ml-1" />;
  }
};

function PostCardComponent({ post }: PostCardProps) {
  const user = useAuthStore((state) => state.user);
  const reactPost = useFeedStore((state) => state.reactPost);
  const addPost = useFeedStore((state) => state.addPost);
  const deletePost = useFeedStore((state) => state.deletePost);
  const editPost = useFeedStore((state) => state.editPost);
  const incrementCommentCount = useFeedStore((state) => state.incrementCommentCount);
  const decrementCommentCount = useFeedStore((state) => state.decrementCommentCount);

  const [showOptions, setShowOptions] = useState(false);
  const [showReactionsPanel, setShowReactionsPanel] = useState(false);
  const [isReactionsPinned, setIsReactionsPinned] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [hasLoadedComments, setHasLoadedComments] = useState(false);
  
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSaved, setIsSaved] = useState(!!post.isSaved);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [editPrivacy, setEditPrivacy] = useState(post.privacy);
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [commentSort, setCommentSort] = useState<'newest' | 'oldest'>('newest');

  const optionsRef = useRef<HTMLDivElement>(null);
  const reactionsRef = useRef<HTMLDivElement>(null);
  const reactionsHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
      if (reactionsRef.current && !reactionsRef.current.contains(event.target as Node)) {
        setShowReactionsPanel(false);
        setIsReactionsPinned(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsSaved(!!post.isSaved);
  }, [post.isSaved, post.id]);

  useEffect(() => {
    return () => {
      if (reactionsHoverTimeoutRef.current) {
        clearTimeout(reactionsHoverTimeoutRef.current);
      }
    };
  }, []);

  const loadComments = useCallback(async () => {
    setIsCommentsLoading(true);
    try {
      const res = await api.get(`/posts/${post.id}/comments`);
      if (res.data?.status === 'success') {
        setComments(res.data.data);
        setHasLoadedComments(true);
      }
    } catch (e) {
      console.error('Error fetching comments', e);
    } finally {
      setIsCommentsLoading(false);
    }
  }, [post.id]);

  const handleToggleComments = useCallback(() => {
    const nextState = !showComments;
    setShowComments(nextState);
    if (nextState && !hasLoadedComments && !isCommentsLoading) {
      loadComments();
    }
  }, [showComments, hasLoadedComments, isCommentsLoading, loadComments]);

  const handleAddComment = useCallback(async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    try {
      const res = await api.post(`/posts/${post.id}/comments`, { content, parentId });
      if (res.data?.status === 'success') {
        const addedComment = res.data.data;
        incrementCommentCount(post.id);

        if (parentId) {
          setComments((prev) =>
            prev.map((c) => {
              if (c.id === parentId) {
                return { ...c, replies: [...(c.replies || []), addedComment] };
              }
              return c;
            })
          );
          setReplyContent('');
          setActiveReplyId(null);
        } else {
          setComments((prev) => [addedComment, ...prev]);
          setNewComment('');
        }
      }
    } catch (err) {
      console.error('Error creating comment', err);
    }
  }, [incrementCommentCount, newComment, post.id, replyContent]);

  const handleDeleteComment = useCallback(async (commentId: string, parentId: string | null = null) => {
    try {
      const res = await api.delete(`/posts/comments/${commentId}`);
      if (res.data?.status === 'success') {
        decrementCommentCount(post.id);
        if (parentId) {
          setComments((prev) =>
            prev.map((c) => {
              if (c.id === parentId) {
                return { ...c, replies: c.replies.filter((r: any) => r.id !== commentId) };
              }
              return c;
            })
          );
        } else {
          setComments((prev) => prev.filter((c) => c.id !== commentId));
        }
      }
    } catch (e) {
      console.error('Error deleting comment', e);
    }
  }, [decrementCommentCount, post.id]);

  const handleEditComment = useCallback(async (commentId: string, content: string, parentId: string | null = null) => {
    try {
      const res = await api.put(`/posts/comments/${commentId}`, { content });
      if (res.data?.status === 'success') {
        const updated = res.data.data;
        if (parentId) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === parentId
                ? { ...c, replies: c.replies.map((r: any) => (r.id === commentId ? { ...r, ...updated } : r)) }
                : c
            )
          );
        } else {
          setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, ...updated } : c)));
        }
      }
    } catch (e) {
      console.error('Error editing comment', e);
    }
  }, []);

  const handleSaveToggle = useCallback(async () => {
    try {
      if (isSaved) {
        await api.delete(`/posts/unsave/${post.id}`);
        setIsSaved(false);
      } else {
        await api.post(`/posts/save/${post.id}`);
        setIsSaved(true);
      }
    } catch (e) {
      console.error('Error toggling saved state', e);
    }
  }, [isSaved, post.id]);

  const handleReport = useCallback(async () => {
    if (!reportReason.trim()) {
      toast.error('Vui lòng nhập lý do báo cáo.');
      return;
    }

    setIsReporting(true);
    try {
      await api.post(`/posts/report/${post.id}`, { reason: reportReason.trim() });
      toast.success('Đã báo cáo bài viết. Đội ngũ quản trị sẽ xem xét.');
      setShowReportModal(false);
      setReportReason('');
      setShowOptions(false);
    } catch (e) {
      console.error('Error reporting post', e);
      toast.error('Không thể gửi báo cáo. Vui lòng thử lại.');
    } finally {
      setIsReporting(false);
    }
  }, [post.id, reportReason]);

  const handleShare = useCallback(() => {
    setShowShareModal(true);
  }, []);

  const handleShared = useCallback((sharedPost: any) => {
    addPost(sharedPost);
  }, [addPost]);

  const handleEditSubmit = useCallback(async () => {
    await editPost(post.id, editContent, editPrivacy);
    setIsEditing(false);
    setShowOptions(false);
  }, [editContent, editPost, editPrivacy, post.id]);

  const handleReactionsMouseEnter = useCallback(() => {
    if (reactionsHoverTimeoutRef.current) {
      clearTimeout(reactionsHoverTimeoutRef.current);
      reactionsHoverTimeoutRef.current = null;
    }
    setShowReactionsPanel(true);
  }, []);

  const handleReactionsMouseLeave = useCallback(() => {
    if (isReactionsPinned) return;
    reactionsHoverTimeoutRef.current = setTimeout(() => {
      setShowReactionsPanel(false);
      reactionsHoverTimeoutRef.current = null;
    }, 700);
  }, [isReactionsPinned]);

  const handleLikeButtonClick = useCallback(() => {
    if (reactionsHoverTimeoutRef.current) {
      clearTimeout(reactionsHoverTimeoutRef.current);
      reactionsHoverTimeoutRef.current = null;
    }

    setIsReactionsPinned((prev) => {
      const nextPinned = !prev;
      setShowReactionsPanel(nextPinned);
      return nextPinned;
    });
  }, []);

  const handleCommentReact = useCallback(async (commentId: string, type: string = 'LIKE') => {
    try {
      const res = await api.post(`/posts/comments/${commentId}/react`, { type });
      if (res.data?.status === 'success') {
        const { hasReacted, reactionType } = res.data.data;
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId) {
              return { ...c, hasReacted, reactionType };
            }
            return {
              ...c,
              replies: c.replies?.map((r: any) =>
                r.id === commentId ? { ...r, hasReacted, reactionType } : r
              ),
            };
          })
        );
      }
    } catch (e) {
      console.error('Error reacting to comment', e);
    }
  }, []);

  const handleReactionSelect = useCallback(async (type: string) => {
    await reactPost(post.id, type);
    setShowReactionsPanel(false);
    setIsReactionsPinned(false);
  }, [post.id, reactPost]);

  const isShortText = useMemo(
    () => post.content && post.content.length < 80 && (!post.media || post.media.length === 0),
    [post.content, post.media]
  );

  const isLongContent = useMemo(
    () => post.content && post.content.length > CONTENT_CHAR_LIMIT,
    [post.content]
  );

  const displayedContent = useMemo(() => {
    if (!post.content) return '';
    if (!isLongContent || isContentExpanded) return post.content;
    return `${post.content.slice(0, CONTENT_CHAR_LIMIT).trim()}...`;
  }, [post.content, isLongContent, isContentExpanded]);

  const reactionSummary = useMemo(() => {
    const types = new Set(post.reactions?.map((r: any) => r.type) || []);
    return Array.from(types)
      .slice(0, 3)
      .map((t) => REACTION_EMOJI[t as string] || '👍')
      .join('');
  }, [post.reactions]);

  return (
    <div className="fb-card p-4 flex flex-col gap-3">
      
      {/* Header Profile Section */}
      <div className="flex items-start justify-between relative">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.authorId}`}>
            <OptimizedAvatar
              src={post.author.profile?.avatarUrl}
              alt={post.author.profile?.displayName}
              size={40}
              priority={false}
              className="w-10 h-10 rounded-full object-cover border border-slate-250 dark:border-transparent"
            />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-1">
              <Link href={`/profile/${post.authorId}`} className="text-[15px] font-semibold text-black dark:text-[#e4e6eb] hover:underline">
                {post.author.profile?.displayName}
              </Link>
              {post.feeling && (
                <span className="text-[12px] text-slate-500">
                  đang cảm thấy <span className="font-semibold text-slate-800 dark:text-slate-350">{post.feeling}</span>
                </span>
              )}
              {post.location && (
                <span className="text-[12px] text-slate-500">
                  tại <span className="font-semibold text-slate-800 dark:text-slate-350">{post.location}</span>
                </span>
              )}
              {post.group && (
                <span className="text-[12px] text-slate-500">
                  {' '}→{' '}
                  <Link href={`/groups/${post.group.id}`} className="font-semibold text-[#1877f2] hover:underline">
                    {post.group.name}
                  </Link>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[12px] text-slate-500 mt-0.5">
              <Link href={`/posts/${post.id}`} className="hover:underline">
                {new Date(post.createdAt).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
              </Link>
              <span>•</span>
              {getPrivacyIcon(post.privacy)}
            </div>
          </div>
        </div>

        {/* Options Button */}
        <div className="relative" ref={optionsRef}>
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-full text-slate-500 dark:text-slate-400 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showOptions && (
            <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-[#242526] rounded-md shadow-lg border border-slate-200 dark:border-[#3e4042] p-1 z-20 flex flex-col">
              {post.authorId === user?.id ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowOptions(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded transition-all text-left w-full"
                  >
                    <Edit3 className="w-4 h-4 text-[#1877f2]" /> Chỉnh sửa
                  </button>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-[#3a3b3c] rounded transition-all text-left w-full mt-0.5"
                  >
                    <Trash2 className="w-4 h-4" /> Xóa bài viết
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSaveToggle}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded transition-all text-left w-full"
                  >
                    <Bookmark className="w-4 h-4 text-amber-500" /> {isSaved ? 'Bỏ lưu' : 'Lưu bài viết'}
                  </button>
                  <button
                    onClick={() => {
                      setShowReportModal(true);
                      setShowOptions(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-[#3a3b3c] rounded transition-all text-left w-full mt-0.5"
                  >
                    <AlertTriangle className="w-4 h-4" /> Báo cáo
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      {isEditing ? (
        <div className="flex flex-col gap-2 p-3.5 bg-slate-50 dark:bg-[#3a3b3c]/40 rounded-lg border border-slate-200 dark:border-[#3e4042]">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full bg-transparent border-0 text-xs focus:ring-0 focus:outline-none dark:text-[#e4e6eb] resize-none"
          />
          <div className="flex justify-between items-center mt-2 border-t border-slate-200 dark:border-[#3e4042] pt-2">
            <select
              value={editPrivacy}
              onChange={(e) => setEditPrivacy(e.target.value as any)}
              className="px-2.5 py-1 bg-white dark:bg-[#3a3b3c] border border-slate-250 dark:border-[#3e4042] rounded-md text-xs dark:text-[#e4e6eb] focus:outline-none"
            >
              <option value="PUBLIC">Công khai</option>
              <option value="FRIENDS">Bạn bè</option>
              <option value="ONLY_ME">Chỉ mình tôi</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#3a3b3c] text-slate-700 dark:text-slate-200 rounded-md text-xs font-bold transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-4 py-1.5 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-md text-xs font-bold transition-all"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p className={`text-slate-800 dark:text-[#e4e6eb] leading-[1.45] break-words whitespace-pre-wrap ${
            isShortText ? 'text-lg md:text-xl font-medium' : 'text-[15px]'
          }`}>
            {displayedContent}
          </p>
          {isLongContent && (
            <button
              type="button"
              onClick={() => setIsContentExpanded((v) => !v)}
              className="text-[15px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mt-1"
            >
              {isContentExpanded ? 'Thu gọn' : 'Xem thêm'}
            </button>
          )}
        </div>
      )}

      {post.isPoll && post.pollOptions && (
        <PostPoll postId={post.id} pollOptions={post.pollOptions} />
      )}

      {post.sharedPost && (
        <Link
          href={`/posts/${post.sharedPost.id}`}
          className="block border border-slate-200 dark:border-[#3e4042] rounded-lg overflow-hidden mt-2 hover:bg-slate-50 dark:hover:bg-[#3a3b3c]/30 transition-colors"
        >
          <div className="p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <OptimizedAvatar
                src={post.sharedPost.author?.profile?.avatarUrl}
                alt={post.sharedPost.author?.profile?.displayName}
                size={28}
                className="w-7 h-7 rounded-full object-cover"
              />
              <span className="text-sm font-semibold text-slate-800 dark:text-[#e4e6eb]">
                {post.sharedPost.author?.profile?.displayName}
              </span>
            </div>
            {post.sharedPost.content && (
              <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3 whitespace-pre-wrap">
                {post.sharedPost.content}
              </p>
            )}
          </div>
          {post.sharedPost.media && post.sharedPost.media.length > 0 && (
            <PostMedia media={post.sharedPost.media} />
          )}
        </Link>
      )}

      {/* Uploaded Media */}
      {post.media && post.media.length > 0 && <PostMedia media={post.media} />}

      {/* Stats Counter Row */}
      <div className="flex justify-between items-center text-[13px] text-slate-500 border-b border-slate-200 dark:border-[#3e4042] pb-2 mt-1 select-none">
        <button
          type="button"
          onClick={() => (post.reactions?.length ?? 0) > 0 && setShowReactionsModal(true)}
          className="flex items-center gap-1 font-semibold text-slate-500 hover:underline"
        >
          {(post.reactions?.length ?? 0) > 0 && (
            <>
              <span className="flex items-center tracking-tighter">{reactionSummary}</span>
              <span>{post.reactions?.length ?? 0}</span>
            </>
          )}
        </button>
        <button onClick={handleToggleComments} className="hover:underline font-semibold">
          {post._count?.comments ?? 0} bình luận
        </button>
      </div>

      {/* Actions Toolbar */}
      <div className="flex justify-between items-center relative py-1 border-b border-slate-200 dark:border-[#3e4042]">
        <div
          ref={reactionsRef}
          className="relative flex-1"
          onMouseEnter={handleReactionsMouseEnter}
          onMouseLeave={handleReactionsMouseLeave}
        >
          <button
            onClick={handleLikeButtonClick}
            className={`flex items-center justify-center gap-2 py-2.5 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-lg transition-colors w-full text-sm font-semibold ${
              post.hasReacted ? getReactionStyle(post.reactionType) : 'text-slate-600 dark:text-slate-350'
            }`}
          >
            <span>👍</span>
            {post.hasReacted ? (post.reactionType === 'LIKE' ? 'Thích' : post.reactionType) : 'Thích'}
          </button>

          {showReactionsPanel && (
            <div
              className="absolute left-1/2 bottom-[calc(100%-4px)] -translate-x-1/2 bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#3e4042] rounded-full px-3 py-1.5 shadow-lg flex gap-3.5 animate-in fade-in duration-200 z-50"
              onMouseEnter={handleReactionsMouseEnter}
              onMouseLeave={handleReactionsMouseLeave}
            >
              <div className="absolute left-0 right-0 top-full h-6" />
              {REACTIONS_LIST.map((r) => (
                <button
                  key={r.type}
                  onClick={() => handleReactionSelect(r.type)}
                  className="hover:scale-135 transition-transform active:scale-95 text-xl p-1"
                  title={r.type}
                >
                  {r.label.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleToggleComments}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-lg text-slate-650 dark:text-slate-350 transition-colors text-sm font-semibold"
        >
          <MessageSquare className="w-4.5 h-4.5 text-slate-500" />
          Bình luận
        </button>

        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded-lg text-slate-650 dark:text-slate-350 transition-colors text-sm font-semibold"
        >
          <Share2 className="w-4.5 h-4.5 text-slate-500" />
          Chia sẻ
        </button>
      </div>

      {/* Comments Container */}
      {showComments && (
        <PostComments
          comments={comments}
          commentSort={commentSort}
          currentUser={user}
          newComment={newComment}
          replyContent={replyContent}
          activeReplyId={activeReplyId}
          isCommentsLoading={isCommentsLoading}
          onNewCommentChange={setNewComment}
          onReplyContentChange={setReplyContent}
          onActiveReplyChange={setActiveReplyId}
          onCommentSortChange={setCommentSort}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          onEditComment={handleEditComment}
          onCommentReact={handleCommentReact}
        />
      )}

      {showReactionsModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowReactionsModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#242526] rounded-xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-200 dark:border-[#3e4042] flex items-center justify-between">
              <h3 className="font-bold text-sm">Cảm xúc về bài viết</h3>
              <button
                type="button"
                onClick={() => setShowReactionsModal(false)}
                className="text-slate-500 hover:text-slate-700 text-sm font-semibold"
              >
                Đóng
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {(post.reactions || []).map((reaction: any) => (
                <Link
                  key={reaction.id}
                  href={`/profile/${reaction.userId}`}
                  onClick={() => setShowReactionsModal(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-[#3a3b3c] transition-colors"
                >
                  <OptimizedAvatar
                    src={reaction.user?.profile?.avatarUrl}
                    alt={reaction.user?.profile?.displayName}
                    size={36}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {reaction.user?.profile?.displayName}
                  </span>
                  <span className="text-lg">{REACTION_EMOJI[reaction.type] || '👍'}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <SharePostModal
          postId={post.id}
          onClose={() => setShowShareModal(false)}
          onShared={handleShared}
        />
      )}

      {showReportModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowReportModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#242526] rounded-xl shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-sm text-[var(--text-primary)] mb-3">Báo cáo bài viết</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Vui lòng mô tả lý do báo cáo..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[#f0f2f5] dark:bg-[#3a3b3c] text-sm resize-none focus:outline-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] rounded-lg"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleReport}
                disabled={isReporting}
                className="px-4 py-2 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50"
              >
                {isReporting ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
