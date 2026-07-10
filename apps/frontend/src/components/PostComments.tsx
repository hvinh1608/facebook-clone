import React, { memo, useState } from 'react';
import { Send } from 'lucide-react';
import OptimizedAvatar from './OptimizedAvatar';

const COMMENT_REACTIONS = [
  { type: 'LIKE', emoji: '👍' },
  { type: 'LOVE', emoji: '❤️' },
  { type: 'HAHA', emoji: '😆' },
  { type: 'WOW', emoji: '😮' },
  { type: 'SAD', emoji: '😢' },
  { type: 'ANGRY', emoji: '😡' },
];

const COMMENT_GIFS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '💯', '🙏', '👏'];

interface PostCommentsProps {
  comments: any[];
  commentSort: 'newest' | 'oldest';
  currentUser: {
    id: string;
    role: 'USER' | 'ADMIN';
    displayName: string;
    avatarUrl?: string | null;
  } | null;
  newComment: string;
  replyContent: string;
  activeReplyId: string | null;
  isCommentsLoading: boolean;
  onNewCommentChange: (value: string) => void;
  onReplyContentChange: (value: string) => void;
  onActiveReplyChange: (commentId: string | null) => void;
  onCommentSortChange: (sort: 'newest' | 'oldest') => void;
  onAddComment: (e: React.FormEvent, parentId?: string | null) => Promise<void>;
  onDeleteComment: (commentId: string, parentId?: string | null) => Promise<void>;
  onEditComment: (commentId: string, content: string, parentId?: string | null) => Promise<void>;
  onCommentReact: (commentId: string, type?: string) => Promise<void>;
}

function CommentActions({
  comment,
  currentUser,
  onActiveReplyChange,
  onDeleteComment,
  onEditComment,
  onCommentReact,
  parentId,
  hasReplies,
  isReplyThreadOpen,
  onToggleReplies,
}: {
  comment: any;
  currentUser: PostCommentsProps['currentUser'];
  onActiveReplyChange: (id: string | null) => void;
  onDeleteComment: (commentId: string, parentId?: string | null) => void;
  onEditComment: (commentId: string, content: string, parentId?: string | null) => Promise<void>;
  onCommentReact: (commentId: string, type?: string) => Promise<void>;
  parentId?: string | null;
  hasReplies?: boolean;
  isReplyThreadOpen?: boolean;
  onToggleReplies?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.content);
  const [showReactions, setShowReactions] = useState(false);
  const canEdit = comment.authorId === currentUser?.id || currentUser?.role === 'ADMIN';

  const handleSaveEdit = async () => {
    if (!editValue.trim()) return;
    await onEditComment(comment.id, editValue.trim(), parentId);
    setIsEditing(false);
  };

  return (
    <>
      {isEditing ? (
        <div className="mt-1 px-2 flex flex-col gap-2">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={2}
            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-[#3a3b3c] border border-slate-200 dark:border-[#3e4042] rounded-lg resize-none focus:outline-none"
          />
          <div className="flex gap-2">
            <button type="button" onClick={handleSaveEdit} className="text-xs font-bold text-[#1877f2]">Lưu</button>
            <button type="button" onClick={() => { setIsEditing(false); setEditValue(comment.content); }} className="text-xs text-slate-500">Hủy</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5 px-2 select-none relative">
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setShowReactions(false)}
              onClick={() => onCommentReact(comment.id, comment.hasReacted ? 'LIKE' : 'LIKE')}
              className={`hover:underline font-semibold ${comment.hasReacted ? 'text-[#1877f2]' : 'text-slate-500'}`}
            >
              {comment.hasReacted ? 'Đã thích' : 'Thích'}
            </button>
            {showReactions && (
              <div
                className="absolute bottom-full left-0 mb-1 flex gap-1 bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#3e4042] rounded-full px-2 py-1 shadow-lg z-10"
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
              >
                {COMMENT_REACTIONS.map((r) => (
                  <button key={r.type} type="button" onClick={() => onCommentReact(comment.id, r.type)} className="hover:scale-125 text-sm">
                    {r.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          {comment.reactions?.length > 0 && (
            <span className="font-semibold">{comment.reactions.length} cảm xúc</span>
          )}
          <span className="font-semibold">
            {new Date(comment.createdAt).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
          </span>
          <button type="button" onClick={() => onActiveReplyChange(comment.id)} className="hover:underline font-semibold text-slate-500">
            Trả lời
          </button>
          {canEdit && (
            <button type="button" onClick={() => setIsEditing(true)} className="hover:underline font-semibold text-slate-500">
              Sửa
            </button>
          )}
          {hasReplies && onToggleReplies && (
            <button type="button" onClick={onToggleReplies} className="hover:underline font-semibold text-slate-500">
              {isReplyThreadOpen ? 'Ẩn phản hồi' : `Xem phản hồi (${comment.replies.length})`}
            </button>
          )}
          {(comment.authorId === currentUser?.id || currentUser?.role === 'ADMIN') && (
            <button type="button" onClick={() => onDeleteComment(comment.id, parentId)} className="text-red-500 hover:underline font-semibold">
              Xóa
            </button>
          )}
        </div>
      )}
    </>
  );
}

function PostCommentsComponent({
  comments,
  commentSort,
  currentUser,
  newComment,
  replyContent,
  activeReplyId,
  isCommentsLoading,
  onNewCommentChange,
  onReplyContentChange,
  onActiveReplyChange,
  onCommentSortChange,
  onAddComment,
  onDeleteComment,
  onEditComment,
  onCommentReact,
}: PostCommentsProps) {
  const [expandedReplyThreadId, setExpandedReplyThreadId] = useState<string | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);

  const sortedComments = [...comments].sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    return commentSort === 'newest' ? tb - ta : ta - tb;
  });

  return (
    <div className="flex flex-col gap-3 mt-1">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-slate-500">Bình luận</span>
        <select
          value={commentSort}
          onChange={(e) => onCommentSortChange(e.target.value as 'newest' | 'oldest')}
          className="text-xs bg-transparent border-0 text-slate-500 font-semibold focus:outline-none cursor-pointer"
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
        </select>
      </div>

      <form onSubmit={(e) => onAddComment(e)} className="flex items-center gap-2.5">
        <OptimizedAvatar
          src={currentUser?.avatarUrl}
          alt={currentUser?.displayName}
          size={32}
          className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-transparent flex-shrink-0"
        />
        <div className="flex-1 bg-[#f0f2f5] dark:bg-[#3a3b3c] px-3.5 py-2 rounded-full border border-slate-200 dark:border-transparent flex items-center gap-2 relative">
          <input
            type="text"
            placeholder="Viết bình luận..."
            value={newComment}
            onChange={(e) => onNewCommentChange(e.target.value)}
            className="flex-1 bg-transparent border-0 text-xs focus:ring-0 focus:outline-none dark:text-white placeholder-slate-500"
          />
          <button type="button" onClick={() => setShowGifPicker(!showGifPicker)} className="text-sm">GIF</button>
          <button type="submit" className="p-1 hover:bg-slate-200 dark:hover:bg-[#3e4042] text-[#1877f2] rounded-full transition-colors">
            <Send className="w-3.5 h-3.5" />
          </button>
          {showGifPicker && (
            <div className="absolute bottom-full right-0 mb-2 p-2 bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#3e4042] rounded-xl shadow-lg grid grid-cols-5 gap-1 z-20">
              {COMMENT_GIFS.map((gif) => (
                <button
                  key={gif}
                  type="button"
                  onClick={() => { onNewCommentChange(newComment + gif); setShowGifPicker(false); }}
                  className="w-8 h-8 hover:bg-slate-100 dark:hover:bg-[#3a3b3c] rounded text-lg"
                >
                  {gif}
                </button>
              ))}
            </div>
          )}
        </div>
      </form>

      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
        {isCommentsLoading && <p className="px-1 text-xs text-slate-500">Đang tải bình luận...</p>}
        {sortedComments.map((comment) => {
          const hasReplies = comment.replies && comment.replies.length > 0;
          const isReplyThreadOpen = expandedReplyThreadId === comment.id;

          return (
            <div key={comment.id} className="flex flex-col gap-1">
              <div className="flex items-start gap-2.5">
                <OptimizedAvatar
                  src={comment.author.profile?.avatarUrl}
                  alt={comment.author.profile?.displayName}
                  size={32}
                  className="rounded-full object-cover border border-slate-200 dark:border-transparent flex-shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="bg-[#f0f2f5] dark:bg-[#3a3b3c] py-2.5 px-3 rounded-[18px] inline-block max-w-full">
                    <p className="text-[13px] font-semibold text-black dark:text-white mb-0.5 leading-normal">{comment.author.profile?.displayName}</p>
                    <p className="text-[13px] text-slate-800 dark:text-[#e4e6eb] leading-normal break-words whitespace-pre-wrap">{comment.content}</p>
                  </div>
                  <CommentActions
                    comment={comment}
                    currentUser={currentUser}
                    onActiveReplyChange={onActiveReplyChange}
                    onDeleteComment={onDeleteComment}
                    onEditComment={onEditComment}
                    onCommentReact={onCommentReact}
                    hasReplies={hasReplies}
                    isReplyThreadOpen={isReplyThreadOpen}
                    onToggleReplies={() => setExpandedReplyThreadId(isReplyThreadOpen ? null : comment.id)}
                  />
                </div>
              </div>

              {activeReplyId === comment.id && (
                <form onSubmit={(e) => onAddComment(e, comment.id)} className="ml-9 flex items-center gap-2 bg-[#f0f2f5] dark:bg-[#3a3b3c] p-2 rounded-full border border-slate-200 dark:border-[#3e4042]">
                  <input
                    type="text"
                    placeholder={`Trả lời ${comment.author.profile?.displayName}...`}
                    value={replyContent}
                    onChange={(e) => onReplyContentChange(e.target.value)}
                    className="flex-1 bg-transparent border-0 text-[11px] focus:ring-0 focus:outline-none placeholder-slate-500 dark:text-white"
                  />
                  <button type="submit" className="p-1 hover:bg-slate-200 dark:hover:bg-[#3e4042] text-[#1877f2] rounded-full">
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              )}

              {hasReplies && isReplyThreadOpen && (
                <div className="ml-9 flex flex-col gap-2 border-l border-slate-200 dark:border-[#3e4042] pl-3.5 mt-1.5">
                  {comment.replies.map((reply: any) => (
                    <div key={reply.id} className="flex items-start gap-2.5">
                      <OptimizedAvatar
                        src={reply.author.profile?.avatarUrl}
                        alt={reply.author.profile?.displayName}
                        size={26}
                        className="rounded-full object-cover border border-slate-200 dark:border-transparent flex-shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="bg-[#f0f2f5] dark:bg-[#3a3b3c] py-2 px-3 rounded-[18px] inline-block max-w-full">
                          <p className="text-[12px] font-semibold text-black dark:text-white mb-0.5 leading-normal">{reply.author.profile?.displayName}</p>
                          <p className="text-[12px] text-slate-800 dark:text-[#e4e6eb] leading-normal break-words whitespace-pre-wrap">{reply.content}</p>
                        </div>
                        <CommentActions
                          comment={reply}
                          currentUser={currentUser}
                          onActiveReplyChange={onActiveReplyChange}
                          onDeleteComment={onDeleteComment}
                          onEditComment={onEditComment}
                          onCommentReact={onCommentReact}
                          parentId={comment.id}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PostComments = memo(PostCommentsComponent);

export default PostComments;
