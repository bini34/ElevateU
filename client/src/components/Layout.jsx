// components/Layout.js
import Nav from '@/components/Nav';

export default function Layout({ children }) {
  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row box-border pt-10">
      <nav className="w-[100px] min-h-screen pt-20 hidden md:block">
        <Nav />
      </nav>
    
      {children}

      </div>
  );
}