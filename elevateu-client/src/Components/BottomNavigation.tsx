import { useState } from "react";

const BottomNavigation = () => {
  const [activeTab, setActiveTab] = useState('home');

  const navItems = [
    { icon: 'home', label: 'Home' },
    { icon: 'search', label: 'Search' },
    { icon: 'plus-circle', label: 'Add' },
    { icon: 'heart', label: 'Notifications' },
    { icon: 'user', label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg md:hidden">
      <ul className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <li key={item.label} className="flex flex-col items-center">
            <button
              className={`p-2 ${activeTab === item.icon ? 'text-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab(item.icon)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Replace icon paths as necessary */}
              </svg>
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default BottomNavigation;
