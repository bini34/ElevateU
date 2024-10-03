// components/Layout.js
import Nav from '@/components/Nav';
import Messagelist from '@/components/Messagelist';
import BottomNavigation from '@/components/BottomNavigation';

export default function Layout({ children }) {
  return (
    <div className="w-full min-h-[100vh] flex box-border pt-10 ">
      <nav className="w-[100px] min-h-[100vh] pt-20 hidden md:block">
        <Nav />
      </nav>
      <div className="w-full min-h-[100vh] rounded-l-[80px] border-l-3 border-t-3 border-b-3 border-r-0 border-solid border-black bg-slate-300 flex">
        <div className="flex flex-col gap-8 h-[100vh] w-[300px] pt-20 pl-3  ">
          <Messagelist />
        </div>
        <div className="w-full min-h-[100vh] pb-4 relative bottom-[15px] rounded-l-[80px] border-l-2 border-t-3 border-b-3 border-r-0 border-solid border-black bg-white pt-7 pl-7 pr-7">
        {children}
          <div className="block md:hidden">
            <BottomNavigation />
          </div>
        </div>
      </div>
    </div>
  );
}
