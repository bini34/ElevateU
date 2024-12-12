
"use client";
import { useState, useContext } from 'react';
import { fetcher } from '../utils/fetcher';
import { AuthContext } from '@/context/AuthContext';

export const useGroup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { authUser } = useContext(AuthContext);


  const Group = async (name, profileImage, description='') => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append(`profileImage`, profileImage);
      formData.append(`owner_id`, authUser.id);


      const data = await fetcher('/group', {
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

  return { Group, loading, error };
};
