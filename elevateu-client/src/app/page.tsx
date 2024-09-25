
import Nav from '@/Components/Nav';
import Header from '@/Components/Header';
import PostCard from '@/Components/PostCard';
import Messagelist from '@/Components/Messagelist';

export default function Home() {
  return(
    <div className="w-full min-h-[100vh] flex box-border pt-10">
      <nav className="w-[100px] min-h-[100vh] pt-20">
      <Nav/>
      </nav>
      <div className="w-full min-h-[100vh]  rounded-l-[80px] border-l-3 border-t-3 border-b-3 border-r-0 border-solid  border-black  bg-slate-300 flex">
        <div className="flex flex-col gap-4 h-[100vh] w-[300px] pt-20 pl-3 ">
          <Messagelist/>
        </div>
        <div className="w-full min-h-[100vh] relative bottom-[15px] rounded-l-[80px] border-l-2 border-t-3 border-b-3 border-r-0 border-solid  border-black bg-white pt-7 pl-7 pr-7">
          <Header/>
          <main className='w-full h-[100vh] flex flex-col  justify-center pt-5'>
            <div className='w-[400px] h-full'>
            <PostCard/>
            <PostCard/>
            </div>
          

          </main>
          
        </div>
      </div>
    </div>
   );
}

