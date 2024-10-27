"use client"
import Layout from '@/components/Layout';
import avator from '../../../public/logo/logo.png';
import Image from 'next/image';
import GroupChatList from '@/components/GroupChatList'; // Ensure this is the correct import
// import useChat from '../../hooks/useChat';
import { useState } from 'react';
import { useGroup } from '@/hooks/useGroup';

export default function GroupLayout({ children }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const {name, setName, description, setDescription, profileImage: groupProfileImage, handleImageChange: handleGroupImageChange} = useState();
  const handleButtonClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const handleSubmit = async () => {
    const response = await Group(name, profileImage, description);
    if (response) {
        console.log('Post successful:', response);
        setContent('');
        setUploadedFiles([]);
        toggleModal();
    }
};
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };



  return (
    <Layout>
      <div className="flex flex-col md:flex-row w-full min-h-screen rounded-l-[80px] border-l-3 border-t-3 border-b-3 border-r-0 border-solid border-black bg-slate-300">
        <div className="flex flex-col gap-4 max-h-screen w-full md:w-[300px] pt-20 pb-20">
          <div className="flex">
            <form className="w-full px-2">
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                  </svg>
                </div>
                <input type="search" className="block w-full p-2 ps-10 text-sm text-gray-900 border ring-black rounded-full bg-gray-50 border-black focus:ring-black focus:border-black" placeholder="Search ..." required />
              </div>
            </form>
            <button className='pr-2' onClick={handleButtonClick}>
              <svg className="w-[36px] h-[36px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4.243a1 1 0 1 0-2 0V11H7.757a1 1 0 1 0 0 2H11v3.243a1 1 0 1 0 2 0V13h3.243a1 1 0 1 0 0-2H13V7.757Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="flex-1 flex-col gap-4 overflow-y-auto no-scrollbar">
            <GroupChatList />
          </div>
        </div>
        <main className="w-full h-full flex flex-col justify-start pt-5 overflow-y-auto no-scrollbar bg-white rounded-l-[80px] border-l-3 border-t-3 border-b-3 border-r-0 border-solid border-black relative bottom-[15px]">
          {children}
        </main>

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[500px] h-[500px] relative">
            <button onClick={handleCloseModal} className="absolute top-4 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100">
            <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/>
            </svg>

            </button>
            <h1 className="text-2xl text-center font-bold mb-8">Create Group</h1>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <div className="relative flex justify-center w-24 h-24 mx-auto mb-2 rounded-full border-2 border-gray-300 overflow-hidden">
                  {groupProfileImage ? (
                    <>
                      <img src={groupProfileImage} alt="Profile" className="w-full h-full object-cover" />
                      <button
                        onClick={(event) => {
                          event.preventDefault();
                          document.getElementById('profilePictureInput').click();
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white opacity-0 hover:opacity-100 transition-opacity"
                      >
                      </button>
                    </>
                  ) : (
                    <label htmlFor="profilePictureInput" className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-gray-500 dark:text-gray-400 rounded-full border-2 border-black ">
                      <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" strokeLinejoin="round" strokeWidth="2" d="M4 18V8a1 1 0 0 1 1-1h1.5l1.707-1.707A1 1 0 0 1 8.914 5h6.172a1 1 0 0 1 .707.293L17.5 7H19a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"/>
                        <path stroke="currentColor" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                      </svg>

                      <span>Upload</span>
                    </label>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleGroupImageChange} className="hidden" id="profilePictureInput" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter group name"
                  className="mt-1 block w-full border-gray-700 rounded-md shadow-sm focus:border-black focus:ring-black dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter group description"
                  className="mt-1 block w-full border-gray-700 rounded-md shadow-sm focus:border-black focus:ring-black dark:bg-gray-700 dark:border-gray-600"
                ></textarea>
              </div>
              <button onClick={handleSubmit} type="submit" className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-black/80">Create</button>
            </form>
          </div>
        </div>
      )}

        {/* Chat Section */}
    </Layout>
  );
}
