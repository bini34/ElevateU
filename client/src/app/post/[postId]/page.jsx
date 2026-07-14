"use client"
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import PostCard from '@/components/PostCard';
import PostSkeleton from '@/components/ui/PostSkeleton';
import { getPostById } from '@/lib/post';

export default function PostPage() {
    const { postId } = useParams();
    const router = useRouter();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await getPostById(postId);
                if (!cancelled) setPost(res.data);
            } catch (err) {
                if (!cancelled) {
                    setError(err.status === 404 ? 'This post no longer exists.' : err.message || 'Could not load the post.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        if (postId) load();
        return () => {
            cancelled = true;
        };
    }, [postId]);

    return (
        <Layout>
            <div className="flex flex-col w-full min-h-screen bg-white md:rounded-l-[80px] md:border-l-2 md:border-t-3 md:border-b-3 md:border-solid md:border-black overflow-hidden">
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md p-4 flex items-center gap-6">
                    <button onClick={() => router.back()} aria-label="Go back" className="p-2 rounded-full hover:bg-gray-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="font-bold text-xl">Post</h1>
                </div>

                <div className="sm:w-[450px] w-full mx-auto flex flex-col gap-5 px-2 sm:px-0 py-6 pb-24">
                    {loading && <PostSkeleton />}

                    {!loading && error && (
                        <div className="flex flex-col items-center gap-3 py-16 text-center">
                            <p className="text-gray-600">{error}</p>
                            <Link href="/" className="text-red-500 font-semibold hover:underline">Back to the feed</Link>
                        </div>
                    )}

                    {!loading && !error && post && (
                        <PostCard
                            post={post}
                            onPostUpdated={(updated) => setPost((current) => ({ ...current, ...updated }))}
                            onPostPatched={(id, patch) => setPost((current) => ({ ...current, ...patch }))}
                            onPostDeleted={() => router.push('/')}
                        />
                    )}
                </div>
            </div>
        </Layout>
    );
}
