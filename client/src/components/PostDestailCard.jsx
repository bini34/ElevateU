"use client";
import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import Image from 'next/image';
import ReactDOM from 'react-dom';
import EmojiPicker from 'emoji-picker-react';
import toast from 'react-hot-toast';
import avator from '../../public/logo/logo.png';
import SocialMediaPostCarousel from './ui/ImageSlider';
import { AuthContext } from '@/context/AuthContext';
import { getPostComments, addComment, updateComment, deleteComment, toggleLike } from '@/lib/post';
import { timeAgo, authorName } from '@/lib/format';

export default function PostDetailCard({ post, onPostPatched, onClose }) {
  const { authUser } = useContext(AuthContext);

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState(null);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const pageRef = useRef(0);

  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [likePending, setLikePending] = useState(false);

  const emojiPickerRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const isLiked = Boolean(post.is_liked);
  const likesCount = post.likes_count ?? 0;
  const attachments = Array.isArray(post.attachments) ? post.attachments : [];

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    setCommentsError(null);
    const nextPage = pageRef.current + 1;
    try {
      const res = await getPostComments(post.id, nextPage);
      const paginator = res?.data;
      const fetched = Array.isArray(paginator?.data) ? paginator.data : [];
      setComments((current) => {
        const seen = new Set(current.map((c) => c.id));
        return [...current, ...fetched.filter((c) => !seen.has(c.id))];
      });
      pageRef.current = nextPage;
      setHasMoreComments(Boolean(paginator?.next_page_url));
    } catch (err) {
      setCommentsError(err.message || 'Could not load comments.');
    } finally {
      setCommentsLoading(false);
    }
  }, [post.id]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Close the emoji picker when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePostLike = async () => {
    if (likePending) return;
    setLikePending(true);
    onPostPatched?.(post.id, {
      is_liked: !isLiked,
      likes_count: likesCount + (isLiked ? -1 : 1),
    });
    try {
      const res = await toggleLike(post.id);
      if (res?.status !== 'success') throw new Error(res?.message);
      onPostPatched?.(post.id, {
        is_liked: res.data.liked,
        likes_count: res.data.likes_count,
      });
    } catch (err) {
      onPostPatched?.(post.id, { is_liked: isLiked, likes_count: likesCount });
      toast.error(err.message || 'Could not update like');
    } finally {
      setLikePending(false);
    }
  };

  const handleEmojiClick = (emojiObject) => {
    if (emojiObject?.emoji) {
      setNewComment((prev) => prev + emojiObject.emoji);
    }
  };

  const handleAddComment = async () => {
    const content = newComment.trim();
    if (!content || posting) return;
    setPosting(true);
    try {
      const res = await addComment(post.id, content);
      if (res?.status !== 'success') throw new Error(res?.message);
      setComments((current) => [...current, res.data.comment]);
      onPostPatched?.(post.id, { comments_count: (post.comments_count ?? 0) + 1 });
      setNewComment('');
      setShowEmojiPicker(false);
    } catch (err) {
      toast.error(err.message || 'Could not add the comment');
    } finally {
      setPosting(false);
    }
  };

  const handleSaveCommentEdit = async (commentId) => {
    const content = editingDraft.trim();
    if (!content) return;
    try {
      const res = await updateComment(commentId, content);
      if (res?.status !== 'success') throw new Error(res?.message);
      setComments((current) =>
        current.map((c) => (c.id === commentId ? res.data.comment : c))
      );
      setEditingId(null);
    } catch (err) {
      toast.error(err.message || 'Could not update the comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await deleteComment(commentId);
      if (res?.status !== 'success') throw new Error(res?.message);
      setComments((current) => current.filter((c) => c.id !== commentId));
      onPostPatched?.(post.id, {
        comments_count: Math.max(0, (post.comments_count ?? 1) - 1),
      });
    } catch (err) {
      toast.error(err.message || 'Could not delete the comment');
    }
  };

  const renderEmojiPicker = () =>
    ReactDOM.createPortal(
      <div
        ref={emojiPickerRef}
        className="absolute bottom-5 right-10 z-[60] transform -translate-x-1/2"
        style={{ width: '320px', height: '450px' }}
      >
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          width="100%"
          height="100%"
          searchPlaceholder="Search emojis..."
          previewConfig={{ showPreview: false }}
        />
      </div>,
      document.body
    );

  const canDeleteComment = (comment) =>
    authUser?.id && (comment.user_id === authUser.id || post.user_id === authUser.id);

  return (
    <div
      className="bg-white w-[95vw] max-w-[1000px] h-[85vh] max-h-[700px] rounded-lg shadow-lg flex justify-center items-center"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="Post details"
    >
      <div className='w-full h-full flex md:flex-row flex-col scrollbar-hide overflow-y-auto'>
        {/* Left side - media (or text-only fallback) */}
        <div className='md:w-[50%] w-full md:h-full flex items-center justify-center bg-[#f4f4f4] rounded-l-lg overflow-hidden'>
          {attachments.length > 0 ? (
            <div className='w-full'>
              <SocialMediaPostCarousel files={attachments} />
            </div>
          ) : (
            <p className='p-8 text-lg whitespace-pre-wrap break-words'>{post.content}</p>
          )}
        </div>

        {/* Right side - comments section */}
        <div className='md:w-[50%] w-full h-full flex flex-col'>
          <header className='w-full flex items-center justify-between gap-3 px-4 py-3 border-b'>
            <div className='flex items-center gap-3'>
              <Image
                className="rounded-full object-cover"
                width={40}
                height={40}
                src={post.user?.profile?.profile_picture_URL || avator}
                alt={`${authorName(post.user)} avatar`}
              />
              <div>
                <div className="font-semibold text-sm">{authorName(post.user)}</div>
                {post.created_at && (
                  <div className='text-xs text-gray-500'>{timeAgo(post.created_at)}</div>
                )}
              </div>
            </div>
            <button onClick={onClose} aria-label="Close" className='text-gray-500 hover:text-black text-xl px-2'>
              &times;
            </button>
          </header>

          <div className='flex-1 overflow-y-auto px-4'>
            {post.content && attachments.length > 0 && (
              <p className='py-3 text-sm whitespace-pre-wrap break-words border-b'>{post.content}</p>
            )}

            {comments.map((comment) => (
              <div key={comment.id} className='flex items-start gap-3 py-3'>
                <Image
                  className="rounded-full object-cover mt-1"
                  width={32}
                  height={32}
                  src={comment.user?.profile?.profile_picture_URL || avator}
                  alt=""
                />
                <div className='flex-1'>
                  {editingId === comment.id ? (
                    <div className='flex flex-col gap-2'>
                      <input
                        className='border rounded-lg px-2 py-1 text-sm w-full'
                        value={editingDraft}
                        onChange={(e) => setEditingDraft(e.target.value)}
                        maxLength={2000}
                      />
                      <div className='flex gap-2 text-xs'>
                        <button className='font-semibold text-blue-500' onClick={() => handleSaveCommentEdit(comment.id)}>Save</button>
                        <button className='text-gray-500' onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className='text-sm'>
                        <span className='font-semibold mr-2'>{authorName(comment.user)}</span>
                        <span className='text-gray-700 whitespace-pre-wrap break-words'>{comment.content}</span>
                      </div>
                      <div className='flex items-center gap-3 mt-1 text-xs text-gray-500'>
                        <span>{timeAgo(comment.created_at)}</span>
                        {authUser?.id === comment.user_id && (
                          <button
                            className='font-semibold hover:text-gray-700'
                            onClick={() => {
                              setEditingId(comment.id);
                              setEditingDraft(comment.content);
                            }}
                          >
                            Edit
                          </button>
                        )}
                        {canDeleteComment(comment) && (
                          <button
                            className='font-semibold text-red-500 hover:text-red-600'
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

            {commentsLoading && <p className='py-4 text-sm text-gray-400 text-center'>Loading comments…</p>}

            {!commentsLoading && commentsError && (
              <div className='py-4 text-center'>
                <p className='text-sm text-gray-500'>{commentsError}</p>
                <button className='text-sm font-semibold text-blue-500' onClick={loadComments}>Try again</button>
              </div>
            )}

            {!commentsLoading && !commentsError && comments.length === 0 && (
              <p className='py-8 text-sm text-gray-400 text-center'>No comments yet. Start the conversation!</p>
            )}

            {hasMoreComments && !commentsLoading && (
              <button className='w-full py-3 text-sm font-semibold text-blue-500' onClick={loadComments}>
                Load more comments
              </button>
            )}
          </div>

          {/* Post actions */}
          <div className='border-t px-4 py-2'>
            <div className='flex gap-4 py-2 items-center'>
              <button
                className={`${isLiked ? 'text-red-500' : 'text-gray-800'} hover:text-gray-600`}
                onClick={handlePostLike}
                disabled={likePending}
                aria-pressed={isLiked}
                aria-label={isLiked ? 'Unlike' : 'Like'}
              >
                <svg className="w-6 h-6" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <span className='text-sm font-semibold'>{likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}</span>
            </div>
          </div>

          {/* Comment input */}
          <div className='border-t px-4 py-3 flex items-center gap-2 relative'>
            <div className="relative">
              <button
                className='text-2xl text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center'
                aria-label="Add emoji"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker(!showEmojiPicker);
                }}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z"></path>
                </svg>
              </button>
              {showEmojiPicker && renderEmojiPicker()}
            </div>
            <input
              type="text"
              placeholder="Add a comment..."
              className='flex-1 text-sm outline-none'
              value={newComment}
              maxLength={2000}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
            />
            <button
              className={`${newComment.trim() && !posting ? 'text-blue-500 hover:text-blue-600' : 'text-blue-300'} font-semibold text-sm`}
              onClick={handleAddComment}
              disabled={!newComment.trim() || posting}
            >
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
