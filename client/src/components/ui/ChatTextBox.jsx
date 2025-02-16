import React, { useState, useEffect, useRef, useContext } from 'react';
import ReactDOM from 'react-dom';
import EmojiPicker from 'emoji-picker-react';
import { useSentMessage } from '@/hooks/useSentMessage';
import { AuthContext } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

import Image from 'next/image';

function ChatTextBox({ chatType, id, onNewMessage, onUpdateMessageStatus }) {

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [message, setMessage] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [filePreviewUrls, setFilePreviewUrls] = useState([]);
    const [showFilePreview, setShowFilePreview] = useState(false);
    const emojiPickerRef = useRef(null);
    const { sendMessage, loading } = useSentMessage();
    const { authUser: user } = useContext(AuthContext);
    const { data } = useData();

    let receiverId = null;
    let groupId = null;

    const handleEmojiClick = (emojiObject) => {
        if (emojiObject && emojiObject.emoji) {
            setMessage(prevMessage => prevMessage + emojiObject.emoji);
        } else {
            console.error("Emoji object is undefined or missing the 'emoji' property");
        }
    };

    useEffect(() => {
        console.log("sending message to group", "chattype", chatType, "id", id);

        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [chatType, id]);

    const renderEmojiPicker = () => {
        return ReactDOM.createPortal(
            <div ref={emojiPickerRef} className="absolute bottom-10 right-10 z-50">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>,
            document.body
        );
    };

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(files);
        setFilePreviewUrls(files.map(file => URL.createObjectURL(file)));
        setShowFilePreview(true);
    };

    const handleSend = async () => {
        console.log("sending message", message, selectedFiles, user.id);
        const newMessage = {
            id: Date.now(), // Temporary ID for optimistic UI
            message,
            sender: {
                user_name: user.name,
                profile: { profile_picture_url: user.profile_picture_url }
            },
            created_at: new Date().toISOString(),
            status: 'Sending', // Initial status
            sender_id: user.id
        };
        onNewMessage(newMessage);
        try {
            let response;
            if (chatType === "user") {
                receiverId = id;
                response = await sendMessage(message, selectedFiles, user.id, receiverId, groupId = null);
            } else if (chatType === "group") {
                groupId = data.id;
                console.log("sending message to group", "senderId", user.id, "receiverId", receiverId, "groupId", groupId);
                response = await sendMessage(message, selectedFiles, user.id, receiverId = null, groupId);
            }
            console.log("response from chatTextBox sendMessage", response.status);
            
            if (response.status === "success") {
                console.log("it send the message")
                onUpdateMessageStatus(newMessage.id, 'Sent');
            } else {
                onUpdateMessageStatus(newMessage.id, 'Failed');
            }
        } catch (error) {
            console.error("Error sending message:", error);
            onUpdateMessageStatus(newMessage.id, 'Failed');
        } finally {
            setShowFilePreview(false);
            setSelectedFiles([]);
            setFilePreviewUrls([]);
            setMessage('');
        }
    };

    const handleCancel = () => {
        setShowFilePreview(false);
        setSelectedFiles([]);
        setFilePreviewUrls([]);
    };

    return (
        <footer className='flex justify-center items-center w-full'>
            <section className="flex bg-[#f4f4f4] rounded-full shadow-md mx-4 py-2 justify-center items-center w-[90%] absolute bottom-6 px-4 relative">
                <div className="flex-grow mx-3">
                    <input
                        type="text"
                        placeholder="Message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            console.log('Key pressed:', e.key); // Log the key to verify its value
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                console.log('Enter pressed, sending message...');
                                handleSend();
                            }
                        }}
                        className="w-full bg-transparent outline-none focus:outline-none active:border-none border-none text-gray-700 placeholder-gray-400 custom-input"
                    />
                </div>

                <button
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    aria-label="Toggle Emoji Picker"
                >
                    <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z"></path>
                    </svg>
                </button>

                <label htmlFor="fileInput" className="text-gray-500 hover:text-gray-700 focus:outline-none mx-3 cursor-pointer" aria-label="Attach File">
                    <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            d="M6.549 5.013A1.557 1.557 0 1 0 8.106 6.57a1.557 1.557 0 0 0-1.557-1.557Z"
                            fillRule="evenodd"
                        />
                        <path
                            fill="none"
                            stroke="currentColor"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="m2 18.605 3.901-3.9a.908.908 0 0 1 1.284 0l2.807 2.806a.908.908 0 0 0 1.283 0l5.534-5.534a.908.908 0 0 1 1.283 0l3.905 3.905"
                        />
                        <path
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M18.44 2.004A3.56 3.56 0 0 1 22 5.564v12.873a3.56 3.56 0 0 1-3.56 3.56H5.568a3.56 3.56 0 0 1-3.56-3.56V5.563a3.56 3.56 0 0 1 3.56-3.56Z"
                        />
                    </svg>
                </label>
                <input
                    type="file"
                    id="fileInput"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    multiple
                />
                {showEmojiPicker && renderEmojiPicker()}
            </section>

            {showFilePreview && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white w-[500px] p-4 rounded shadow-lg">
                        {filePreviewUrls.map((url, index) => (
                            <div key={index} className="mb-4">
                                {selectedFiles[index].type.startsWith('image/') && (
                                    <Image src={url} alt="Preview" className="max-h-40 mx-auto" width={100} height={100} />
                                )}
                                {selectedFiles[index].type.startsWith('video/') && (
                                    <video controls src={url} className="max-h-40 mx-auto" />
                                )}
                            </div>
                        ))}
                        <div className='flex'>
                            <input
                                type="text"
                                placeholder="Message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full mb-4 p-2 border rounded custom-input"
                            />
                            <button
                                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                aria-label="Toggle Emoji Picker"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z"></path>
                                </svg>
                            </button>
                        </div>
                        <div className="flex justify-end">
                            <button
                                className="text-red-500 px-2 py-2 rounded mr-2"
                                onClick={handleCancel}
                                aria-label="Cancel"
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-black text-white border-2 border-black px-4 py-2 rounded"
                                onClick={handleSend}
                                disabled={loading}
                                aria-label="Send"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </footer>
    );
}

export default ChatTextBox;
