// pages/index.js (Home page)
import Layout from '@/components/Layout';
import PostCard from '@/components/PostCard';
import Header from '@/components/Header';



export default function Home() {
  return (
    <Layout>
      <Header />
          <main className="w-full h-[calc(100vh-160px)] flex flex-col justify-start pt-5 overflow-y-auto no-scrollbar">
          <div className="w-[450px] mx-auto flex flex-col gap-6">
            <PostCard />
            <PostCard />
            <PostCard />
          </div>
          </main>
    
    </Layout>
  );
}
