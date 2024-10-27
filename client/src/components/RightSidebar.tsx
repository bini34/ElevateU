const RightSidebar = () => {
  const suggestedUsers = [
    { username: 'User One', handle: '@userone' },
    { username: 'User Two', handle: '@usertwo' },
    // Add more users here
  ];

  return (
    <div className="hidden w-[100px] md:block md:w-1/4 lg:w-1/4 p-4 bg-white shadow-lg">
      <h3 className="font-semibold mb-4">Suggested Follows</h3>
      <ul>
        {suggestedUsers.map((user, index) => (
          <li key={index} className="flex justify-between items-center mb-2">
            <div>
              <p className="font-semibold">{user.username}</p>
              <p className="text-gray-500 text-sm">{user.handle}</p>
            </div>
            <button className="bg-blue-500 text-white px-3 py-1 rounded">Follow</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RightSidebar;
