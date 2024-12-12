"use client"
import Layout from '@/components/Layout';
import PostCard from '@/components/PostCard';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import useFetchData from '@/hooks/useFetchData';


export default function Home() {
  const { data, loading, error } = useFetchData('/posts');

  const posts = data && Array.isArray(data.data?.data) ? data.data.data : [];
 console.log("posts", data);
  return (
    <Layout>
      <div className="flex flex-col w-full h-auto md:pb-4 relative md:rounded-l-[80px] md:border-l-2 md:border-t-3 md:border-b-3 md:border-r-0 md:border-solid md:border-black bg-white pt-2 md:pt-7 md:pl-7 md:pr-7">
        <div className="flex-grow">
          <div className='hidden md:block'>
          <Header />
          </div>
          <main className="w-full h-[90vh] flex flex-col justify-start pt-5 overflow-y-auto no-scrollbar">
            <div className="sm:w-[450px] w-full mx-auto flex flex-col gap-5">
             {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {loading && <p>Loading...</p>}
              {error && <p>Error: {error}</p>}
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}
