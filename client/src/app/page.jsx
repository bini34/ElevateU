"use client"
import Layout from '@/components/Layout';
import PostCard from '@/components/PostCard';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import useFetchData from '@/hooks/useFetchData';


export default function Home() {
  const { data, loading, error } = useFetchData('/api/posts');

  const posts = data && Array.isArray(data.data?.data) ? data.data.data : [];

  return (
    <Layout>
      <div className="flex flex-col w-full max-h-screen pb-4 relative rounded-l-[80px] border-l-2 border-t-3 border-b-3 border-r-0 border-solid border-black bg-white pt-7 pl-7 pr-7">
        <div className="flex-grow">
          <Header />
          <main className="w-full h-[calc(100vh-160px)] flex flex-col justify-start pt-5 overflow-y-auto no-scrollbar">
            <div className="w-[450px] mx-auto flex flex-col gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {loading && <p>Loading...</p>}
              {error && <p>Error: {error}</p>}
            </div>
          </main>
        </div>
        <div className="block md:hidden mt-auto">
          <BottomNavigation />
        </div>
      </div>
    </Layout>
  );
}
