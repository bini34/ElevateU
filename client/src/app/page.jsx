"use client"
import { useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import PostCard from '@/components/PostCard';
import Header from '@/components/Header';
import PostSkeleton from '@/components/ui/PostSkeleton';
import usePosts from '@/hooks/usePosts';

export default function Home() {
  const {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    prependPost,
    replacePost,
    patchPost,
    removePost,
  } = usePosts();

  // Load the next page when the sentinel at the bottom becomes visible
  const sentinelRef = useRef(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, posts.length]);

  return (
    <Layout>
      <div className="flex flex-col w-full h-auto md:pb-4 relative md:rounded-l-[80px] md:border-l-2 md:border-t-3 md:border-b-3 md:border-r-0 md:border-solid md:border-black bg-white pt-2 md:pt-7 md:pl-7 md:pr-7">
        <div className="flex-grow">
          <div className='hidden md:block'>
            <Header onPostCreated={prependPost} />
          </div>
          <main className="w-full h-[90vh] flex flex-col justify-start pt-5 overflow-y-auto no-scrollbar">
            <div className="sm:w-[450px] w-full mx-auto flex flex-col gap-5 pb-10">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostUpdated={replacePost}
                  onPostPatched={patchPost}
                  onPostDeleted={removePost}
                />
              ))}

              {loading && (
                <>
                  <PostSkeleton />
                  <PostSkeleton />
                </>
              )}

              {!loading && error && (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <p className="text-gray-600">{error}</p>
                  <button
                    onClick={loadMore}
                    className="px-4 py-2 bg-red-500 text-white rounded-3xl hover:bg-red-400"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!loading && !error && posts.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-16 text-center">
                  <p className="text-lg font-semibold">No posts yet</p>
                  <p className="text-gray-500">Be the first to share something!</p>
                </div>
              )}

              <div ref={sentinelRef} aria-hidden="true" />

              {!hasMore && posts.length > 0 && (
                <p className="text-center text-sm text-gray-400 py-4">
                  You&apos;re all caught up
                </p>
              )}
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}
