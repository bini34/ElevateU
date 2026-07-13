"use client";
import Image from 'next/image';
import avator from '../../public/logo/logo.png';
import { useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import PostDetailCard from '@/components/PostDestailCard';
import SocialMediaPostCarousel from './ui/ImageSlider';
import { AuthContext } from '@/context/AuthContext';
import { toggleLike, deletePost, updatePost } from '@/lib/post';
import { timeAgo, authorName, authorHandle } from '@/lib/format';

export default function PostCard({ post, onPostUpdated, onPostPatched, onPostDeleted }) {
  const { authUser } = useContext(AuthContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(post.content || '');
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef(null);

  const isOwner = authUser?.id && authUser.id === post.user_id;
  const isLiked = Boolean(post.is_liked);
  const likesCount = post.likes_count ?? 0;
  const commentsCount = post.comments_count ?? 0;
  const attachments = Array.isArray(post.attachments) ? post.attachments : [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLikeClick = async () => {
    if (likePending) return;
    setLikePending(true);

    // Optimistic update, reverted if the request fails
    onPostPatched?.(post.id, {
      is_liked: !isLiked,
      likes_count: likesCount + (isLiked ? -1 : 1),
    });

    try {
      const res = await toggleLike(post.id);
      if (res?.status !== 'success') {
        throw new Error(res?.message || 'Could not update like');
      }
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

  const handleSaveEdit = async () => {
    const content = editDraft.trim();
    if (!content || saving) return;
    setSaving(true);
    try {
      const res = await updatePost(post.id, content);
      if (res?.status !== 'success') {
        throw new Error(res?.message || 'Could not update the post');
      }
      onPostUpdated?.(res.data.post);
      setIsEditing(false);
      toast.success('Post updated');
    } catch (err) {
      toast.error(err.message || 'Could not update the post');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await deletePost(post.id);
      if (res?.status !== 'success') {
        throw new Error(res?.message || 'Could not delete the post');
      }
      onPostDeleted?.(post.id);
      toast.success('Post deleted');
    } catch (err) {
      toast.error(err.message || 'Could not delete the post');
      setDeleting(false);
    }
  };

  return (
    <article className="flex flex-col items-center gap-2 w-full sm:w-[450px]">
      <div className='flex flex-col items-center p-2 rounded-3xl gap-2 bg-[#f4f4f4] w-full'>
        <div className="flex items-center gap-2 w-full pl-2">
          <Image
            className="rounded-full object-cover"
            width={30}
            height={30}
            src={post.user?.profile?.profile_picture_URL || avator}
            alt={`${authorName(post.user)} avatar`}
          />
          <div className="font-normal flex-1">
            <div className="text-sm">{authorName(post.user)}</div>
            <div className="text-sm text-gray-500">
              {authorHandle(post.user)}
              {post.created_at && <span className="ml-2 text-xs text-gray-400">{timeAgo(post.created_at)}</span>}
            </div>
          </div>

          {isOwner && (
            <div className="relative" ref={menuRef}>
              <button
                aria-label="Post options"
                className="px-2 text-gray-600 hover:text-black"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <svg fill="currentColor" height="20" width="20" viewBox="0 0 24 24" role="img">
                  <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-7 w-36 bg-white rounded-xl shadow-lg z-40 border border-gray-100 p-1">
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg"
                    onClick={() => {
                      setEditDraft(post.content || '');
                      setIsEditing(true);
                      setMenuOpen(false);
                    }}
                  >
                    Edit post
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    onClick={() => {
                      setMenuOpen(false);
                      handleDelete();
                    }}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting…' : 'Delete post'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className='w-full px-2 pb-3 flex flex-col gap-2'>
            <textarea
              className="w-full p-2 border rounded-xl text-sm"
              rows={3}
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              maxLength={5000}
            />
            <div className='flex gap-2 justify-end'>
              <button
                className='px-3 py-1 text-sm rounded-3xl border border-gray-300 hover:bg-gray-100'
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className='px-3 py-1 text-sm rounded-3xl bg-black text-white hover:bg-gray-800 disabled:opacity-50'
                onClick={handleSaveEdit}
                disabled={saving || !editDraft.trim()}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          post.content && (
            <div className='pb-5 pl-2 w-full'>
              <p className='text-left whitespace-pre-wrap break-words'>{post.content}</p>
            </div>
          )
        )}

        {attachments.length !== 0 && <SocialMediaPostCarousel files={attachments} />}

        {isModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50"
            onClick={() => setIsModalOpen(false)}
          >
            <PostDetailCard
              post={post}
              onPostPatched={onPostPatched}
              onClose={() => setIsModalOpen(false)}
            />
          </div>
        )}
      </div>

      <div className='flex flex-col w-full px-4 py-2 gap-1'>
        <div className='flex justify-between w-full'>
          <div className='flex gap-3'>
            <button
              onClick={handleLikeClick}
              disabled={likePending}
              aria-pressed={isLiked}
              aria-label={isLiked ? 'Unlike' : 'Like'}
              className={isLiked ? 'text-red-500' : ''}
            >
              <svg aria-hidden="true" fill="currentColor" height="24" viewBox="0 0 24 24" width="24">
                <path d={isLiked ? "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" : "M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"} />
              </svg>
            </button>
            <button onClick={() => setIsModalOpen(true)} aria-label="View comments">
              <svg aria-hidden="true" fill="currentColor" height="24" viewBox="0 0 24 24" width="24">
                <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </button>
          </div>
        </div>
        <div className='text-sm text-gray-600'>
          <span className='font-semibold'>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
          {commentsCount > 0 && (
            <button className='ml-3 text-gray-500 hover:underline' onClick={() => setIsModalOpen(true)}>
              View {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
