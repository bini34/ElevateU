"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { getPosts } from '../lib/post';

// Feed state: paginated post list with helpers to keep the UI in sync
// after create/edit/delete/like without refetching everything.
export default function usePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const inFlightRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    setError(null);

    const nextPage = pageRef.current + 1;

    try {
      const body = await getPosts(nextPage);
      const paginator = body?.data;
      const newPosts = Array.isArray(paginator?.data) ? paginator.data : [];

      setPosts((current) => {
        // Guard against duplicates if a page is delivered twice
        const seen = new Set(current.map((post) => post.id));
        return [...current, ...newPosts.filter((post) => !seen.has(post.id))];
      });
      pageRef.current = nextPage;
      setHasMore(Boolean(paginator?.next_page_url));
    } catch (err) {
      setError(err.message || 'Could not load the feed.');
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMore();
  }, [loadMore]);

  const prependPost = useCallback((post) => {
    setPosts((current) => [post, ...current.filter((p) => p.id !== post.id)]);
  }, []);

  const replacePost = useCallback((post) => {
    setPosts((current) => current.map((p) => (p.id === post.id ? { ...p, ...post } : p)));
  }, []);

  const patchPost = useCallback((postId, patch) => {
    setPosts((current) =>
      current.map((p) => (p.id === postId ? { ...p, ...patch } : p))
    );
  }, []);

  const removePost = useCallback((postId) => {
    setPosts((current) => current.filter((p) => p.id !== postId));
  }, []);

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    prependPost,
    replacePost,
    patchPost,
    removePost,
  };
}
