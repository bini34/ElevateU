'use client';
import { useState, useContext } from 'react';
import Image from 'next/image';
import avator from '../../public/images/avator.png';
import { usePost } from '../hooks/usePost';
import { AuthContext } from '@/context/AuthContext';
export default function Header() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [content, setContent] = useState('');
    const { post, loading, error } = usePost();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { authUser } = useContext(AuthContext);

    // // Fetch user data from cookies
    // useEffect(() => {
    //     if (authUser) {
    //         console.log("auth user from header", authUser);
    //         setUser({
    //             id: authUser.id,
    //             firstName: authUser.profile.first_name,
    //             lastName: authUser.profile.last_name,
    //             avatar: authUser.profile.profile_picture_url || avator, // Fallback to default avatar if not available
    //         });
    //         console.log("user from header", user);
    //     }
    // }, []);

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        setUploadedFiles(files);
    };

    const handleSubmit = async () => {
        const userId = authUser.id; // Replace with actual user ID
        console.log("content before post ", content);
        const response = await post(content, uploadedFiles, userId);
        if (response) {
            console.log('Post successful:', response);
            setContent('');
            setUploadedFiles([]);
            toggleModal();
        }
        else {
            console.log('Post failed:', error);
        }
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <header className="px-10 pb-5 w-full flex justify-between items-center">
            <h1 className="font-bold">ElevateU</h1>
            <div className="w-[500px]">
                <form className="w-full sm:w-auto sm:flex-grow">   
                    <div className="relative">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                            </svg>
                        </div>
                        <input type="search" className="block w-full p-2 ps-10 text-sm text-gray-900 border ring-black rounded-full bg-gray-50 border-black focus:ring-black focus:border-black" placeholder="Search ..." required />
                    </div>
                </form>
            </div>
            <div className="flex gap-3 items-center">
                <button onClick={toggleModal}>
                    <svg className="w-[36px] h-[36px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4.243a1 1 0 1 0-2 0V11H7.757a1 1 0 1 0 0 2H11v3.243a1 1 0 1 0 2 0V13h3.243a1 1 0 1 0 0-2H13V7.757Z" clipRule="evenodd" />
                    </svg>
                </button>

                <svg className="w-[28px] h-[28px] text-red-600 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5.365V3m0 2.365a5.338 5.338 0 0 1 5.133 5.368v1.8c0 2.386 1.867 2.982 1.867 4.175 0 .593 0 1.292-.538 1.292H5.538C5 18 5 17.301 5 16.708c0-1.193 1.867-1.789 1.867-4.175v-1.8A5.338 5.338 0 0 1 12 5.365ZM8.733 18c.094.852.306 1.54.944 2.112a3.48 3.48 0 0 0 4.646 0c.638-.572 1.236-1.26 1.33-2.112h-6.92Z" />
                </svg>

                <div className="flex items-center gap-3 relative">
                    <div onClick={toggleMenu} className="flex items-center gap-3 cursor-pointer">
                        <Image
                            className="rounded-full"
                            width={30}
                            height={30}
                            src={authUser?.profile?.profile_picture_URL || avator } // User avatar or fallback to default
                            alt={`${authUser?.profile?.first_name} ${authUser?.profile?.last_name}`}
                        />
                        <span>{`${authUser?.profile?.first_name} ${authUser?.profile?.last_name}`}</span>
                    </div>
                    {isMenuOpen && (
                        <div className="absolute mt-2 w-48 bg-white rounded-md shadow-lg z-50">
                            <div className="py-1">
                                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer">Profile</button>
                                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer">Logout</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-[500px]">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center">
                                <Image className="rounded-full" width={40} height={40} src={authUser?.profile.avatar || avator} alt="Profile" />
                                <span className="ml-2 font-bold">{`${authUser?.profile?.first_name} ${authUser?.profile?.last_name}`}</span>
                            </div>
                            <button onClick={toggleModal} className="text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200 px-3 py-1">
                                &times;
                            </button>
                        </div>
                        <textarea
                            className="w-full p-2 border rounded custom-input"
                            placeholder={`What's on your mind, ${authUser?.profile?.first_name}`}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows="4"
                        ></textarea>
                        <div className="mt-4 w-full grid grid-cols-3 gap-2">
                            {uploadedFiles.map((file, index) => (
                                <div key={index} className="mt-2">
                                    {file.type.startsWith('image/') ? (
                                        <Image src={URL.createObjectURL(file)} alt="Preview" fill className="w-full h-auto rounded" />
                                    ) : (
                                        <video controls className="w-full h-auto rounded">
                                            <source src={URL.createObjectURL(file)} type={file.type} />
                                            Your browser does not support the video tag.
                                        </video>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <div className="flex space-x-2">
                                <label className="p-2 rounded cursor-pointer">
                                    <Image className="x1b0d499 xl1xv1r" alt="" src="https://static.xx.fbcdn.net/rsrc.php/v3/y7/r/Ivw7nhRtXyo.png" width={24} height={24} />
                                    <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                                </label>
                            </div>
                            <button className="px-4 py-2 bg-black text-white rounded" onClick={handleSubmit}>
                               {loading ? "Posting..." : "Post"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
