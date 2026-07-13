"use client";
import { useState } from 'react';
import { createPost } from '../lib/post';

// Hook for creating a post (used by the Header modal and /create-post page).
export const usePost = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const post = async (content = '', files = []) => {
    if (loading) return null; // prevent duplicate submits
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      if (content) {
        formData.append('content', content);
      }
      files.forEach((file, index) => {
        formData.append(`file[${index}]`, file);
      });

      const data = await createPost(formData);

      if (data?.status !== 'success') {
        const message = Array.isArray(data?.message)
          ? data.message.join(' ')
          : data?.message || 'Could not create the post.';
        throw new Error(message);
      }

      return data.data.post;
    } catch (err) {
      setError(err.message || 'Could not create the post.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { post, loading, error };
};
