"use client";
import { useState } from 'react';
import { fetcher } from '../utils/fetcher';

// Create a group. The owner is derived from the auth token server-side.
export const useGroup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createGroup = async (name, profilePictureFile, description = '') => {
    if (loading) return null;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      if (profilePictureFile instanceof File) {
        formData.append('profile_picture', profilePictureFile);
      }

      return await fetcher('/group', { method: 'POST', body: formData });
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createGroup, loading, error };
};
