"use client"
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '@/components/Layout';
import PostCard from '@/components/PostCard';
import PostSkeleton from '@/components/ui/PostSkeleton';
import avator from '../../../public/logo/logo.png';
import { AuthContext } from '@/context/AuthContext';
import { getProfile } from '@/lib/profile';
import { getUserPosts } from '@/lib/post';

export default function ProfilePage() {
    const { name } = useParams();
    const router = useRouter();
    const { authUser } = useContext(AuthContext);

    const [profileUser, setProfileUser] = useState(null);
    const [postsCount, setPostsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const pageRef = useRef(0);

    const isOwnProfile = authUser?.user_name === decodeURIComponent(name ?? '');

    const loadPosts = useCallback(async (userId) => {
        setPostsLoading(true);
        const nextPage = pageRef.current + 1;
        try {
            const res = await getUserPosts(userId, nextPage);
            const paginator = res?.data;
            setPosts((current) => {
                const seen = new Set(current.map((p) => p.id));
                return [...current, ...(paginator?.data ?? []).filter((p) => !seen.has(p.id))];
            });
            pageRef.current = nextPage;
            setHasMore(Boolean(paginator?.next_page_url));
        } catch {
            /* posts area shows what it has; profile header already rendered */
        } finally {
            setPostsLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            setPosts([]);
            pageRef.current = 0;
            try {
                const res = await getProfile(decodeURIComponent(name));
                if (cancelled) return;
                setProfileUser(res.data.user);
                setPostsCount(res.data.posts_count ?? 0);
                await loadPosts(res.data.user.id);
            } catch (err) {
                if (!cancelled) {
                    setError(err.status === 404 ? 'This user does not exist.' : err.message || 'Could not load the profile.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        if (name) load();
        return () => {
            cancelled = true;
        };
    }, [name, loadPosts]);

    const patchPost = (postId, patch) => {
        setPosts((current) => current.map((p) => (p.id === postId ? { ...p, ...patch } : p)));
    };
    const replacePost = (post) => {
        setPosts((current) => current.map((p) => (p.id === post.id ? { ...p, ...post } : p)));
    };
    const removePost = (postId) => {
        setPosts((current) => current.filter((p) => p.id !== postId));
        setPostsCount((count) => Math.max(0, count - 1));
    };

    const profile = profileUser?.profile;
    const displayName = profile
        ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || profileUser?.user_name
        : profileUser?.user_name;

    return (
        <Layout>
            <div className="app-page flex flex-col overflow-hidden p-2 md:p-6">
                {/* Header with back button */}
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md p-4 flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        aria-label="Go back"
                        className="p-2 rounded-full hover:bg-gray-100"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="font-bold text-xl">{loading ? 'Profile' : displayName}</h1>
                        {!loading && !error && (
                            <p className="text-sm text-gray-500">{postsCount} {postsCount === 1 ? 'post' : 'posts'}</p>
                        )}
                    </div>
                </div>

                {loading && (
                    <div className="p-6 flex flex-col gap-4 animate-pulse">
                        <div className="h-32 bg-gray-200 rounded-xl" />
                        <div className="w-24 h-24 rounded-full bg-gray-300 -mt-16 ml-4 border-4 border-white" />
                        <div className="h-4 w-40 bg-gray-200 rounded" />
                        <div className="h-3 w-24 bg-gray-200 rounded" />
                    </div>
                )}

                {!loading && error && (
                    <div className="flex flex-col items-center gap-3 py-24 text-center">
                        <p className="text-gray-600">{error}</p>
                        <Link href="/" className="text-red-500 font-semibold hover:underline">Back to the feed</Link>
                    </div>
                )}

                {!loading && !error && profileUser && (
                    <>
                        {/* Profile Section */}
                        <div className="relative">
                            <div className="h-32 bg-red-500 relative"></div>

                            <div className="absolute left-4 -bottom-12">
                                <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden">
                                    <Image
                                        src={profile?.profile_picture_URL || avator}
                                        alt={`${displayName} avatar`}
                                        width={96}
                                        height={96}
                                        className="object-cover w-24 h-24"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end p-4">
                                {isOwnProfile && (
                                    <Link
                                        href="/settings/change-profile"
                                        className="px-4 py-1.5 rounded-full border border-gray-300 font-semibold hover:bg-gray-50"
                                    >
                                        Edit Profile
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Profile Info */}
                        <div className="px-4 pt-6">
                            <h2 className="font-bold text-xl">{displayName}</h2>
                            <p className="text-gray-500">@{profileUser.user_name}</p>
                            {profile?.bio && <p className="mt-3 whitespace-pre-wrap break-words">{profile.bio}</p>}
                            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                                {profile?.location && (
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        {profile.location}
                                    </span>
                                )}
                                {profileUser.created_at && (
                                    <span>Joined {new Date(profileUser.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                                )}
                            </div>
                        </div>

                        {/* Posts */}
                        <div className="mt-6 border-t border-gray-100 pt-6 pb-16">
                            <div className="sm:w-[450px] w-full mx-auto flex flex-col gap-5 px-2 sm:px-0">
                                {posts.map((post) => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        onPostUpdated={replacePost}
                                        onPostPatched={patchPost}
                                        onPostDeleted={removePost}
                                    />
                                ))}

                                {postsLoading && <PostSkeleton />}

                                {!postsLoading && posts.length === 0 && (
                                    <p className="text-center text-gray-400 py-10">
                                        {isOwnProfile ? "You haven't posted anything yet." : 'No posts yet.'}
                                    </p>
                                )}

                                {hasMore && !postsLoading && (
                                    <button
                                        onClick={() => loadPosts(profileUser.id)}
                                        className="mx-auto text-sm text-blue-500 hover:underline"
                                    >
                                        Load more posts
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
}
