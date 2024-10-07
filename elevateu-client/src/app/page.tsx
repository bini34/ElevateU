// pages/index.js (Home page)
import Layout from '@/components/Layout';
import PostCard from '@/components/PostCard';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';



export default function Home() {
  return (
    <Layout>
         <div className="flex flex-col w-full max-h-screen pb-4 relative  rounded-l-[80px] border-l-2 border-t-3 border-b-3 border-r-0 border-solid border-black bg-white pt-7 pl-7 pr-7">
          <div className="flex-grow">
       
      <Header />
          <main className="w-full h-[calc(100vh-160px)] flex flex-col justify-start pt-5 overflow-y-auto no-scrollbar">
          <div className="w-[450px] mx-auto flex flex-col gap-6">
            <PostCard />
            <PostCard />
            <PostCard />
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
