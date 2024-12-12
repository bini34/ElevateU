// components/Layout.js
import Nav from '@/components/Nav';
import BottomNavigation from '@/components/BottomNavigation';
export default function Layout({ children }) {
  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row box-border md:pt-10">
      <nav className="w-[100px] min-h-screen pt-20 hidden md:block">
        <Nav />
      </nav>
    
      {children}
      <div className="block md:hidden mt-auto z-50">
          <BottomNavigation />
        </div>
      </div>
  );
}