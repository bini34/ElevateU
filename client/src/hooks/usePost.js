"use client";
import { useState } from 'react';
import  Fetch  from '../lib/fetcher';

export const usePost = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const post = async (content='', files, userId) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('user_id', userId);
      files.forEach((file, index) => {
        formData.append(`file[${index}]`, file);
      });

      const data = await Fetch('/post', {
        method: 'post',
        body: formData,
      });
      console.log("data from post hooks", data);

      // Handle successful post, like redirecting or storing post details
      return data;
    } catch (err) {
      setError(err.response.data || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { post, loading, error };
};
