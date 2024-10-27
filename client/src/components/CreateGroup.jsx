"use client"
import { useState, useEffect } from 'react';
import { useGroup } from '../hooks/useGroup'; // Import the useGroup hook

export default function CreateGroup({ setIsModalOpen }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const { Group, loading, error } = useGroup(); // Destructure Group from useGroup
    const [successMessage, setSuccessMessage] = useState(null); // State for success message

    useEffect(() => {
        if (error) {
            alert(`Error: ${error}`); // Simple alert for error
        }
    }, [error]);

    useEffect(() => {
        if (successMessage) {
            alert(`Success: ${successMessage}`); // Simple alert for success
        }
    }, [successMessage]);

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const response = await Group(name, profileImage, description);
        if (response) {
            setSuccessMessage('Group created successfully!');
            setName('');
            setDescription('');
            setProfileImage(null);
            setIsModalOpen(false);
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[500px] h-[500px] relative">
            <button onClick={handleCloseModal} className="absolute top-4 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100">
                <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6"/>
                </svg>
            </button>
            <h1 className="text-2xl text-center font-bold mb-8">Create Group</h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <div className="relative flex justify-center w-24 h-24 mx-auto mb-2 rounded-full border-2 border-gray-300 overflow-hidden">
                        {profileImage ? (
                            <>
                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
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
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="profilePictureInput" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter group name"
                        required
                        className="mt-1 block w-full border-gray-700 rounded-md shadow-sm focus:border-black focus:ring-black dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter group description"
                        required
                        className="mt-1 block w-full border-gray-700 rounded-md shadow-sm focus:border-black focus:ring-black dark:bg-gray-700 dark:border-gray-600"
                    ></textarea>
                </div>
                <button 
                    type="submit" 
                    className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-black/80"
                    disabled={loading} // Disable button when loading
                >
                    {loading ? 'Loading...' : 'Create'} // Display 'Loading...' when loading
                </button>
            </form>
        </div>
    );
}
