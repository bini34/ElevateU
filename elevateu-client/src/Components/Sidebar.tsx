import Link from 'next/link';
const Sidebar = () => {

  return (
    <nav className="w-30 h-full flex flex-col p-4 pt-9">
      <Link href="/">
        <li>Home</li>
      </Link>
      <Link href="/">
        <li>Search</li>
      </Link>
      <Link href="/">
        <li>Notifications</li>
      </Link>
      <Link href="/">
        <li>Profile</li>
      </Link>
    </nav>

  )
  }
export default Sidebar;
