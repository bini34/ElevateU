import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import EmojiPicker from 'emoji-picker-react';

function ChatTextBox() {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [message, setMessage] = useState('');
    const emojiPickerRef = useRef(null);

    const handleEmojiClick = (emojiObject) => {
        if (emojiObject && emojiObject.emoji) {
            setMessage(prevMessage => prevMessage + emojiObject.emoji);
        } else {
            console.error("Emoji object is undefined or missing the 'emoji' property");
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Function to render the emoji picker in a portal
    const renderEmojiPicker = () => {
        return ReactDOM.createPortal(
            <div ref={emojiPickerRef} className="absolute bottom-10 right-10 z-50">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>,
            document.body
        );
    };

    // Function to handle file selection
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            console.log("Selected file:", file);
            // You can add further logic to handle the file here
        }
    };

    return (
        <div className='flex justify-center items-center w-full'>
            <div className="flex bg-[#f4f4f4] rounded-full shadow-md mx-4 py-2 justify-center items-center w-[90%] absolute bottom-6 px-4 relative">
                {/* Emoji Button */}
            

                {/* Message Input */}
                <div className="flex-grow mx-3">
                    <input
                        type="text"
                        placeholder="Message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full bg-transparent outline-none focus:outline-none active:border-none border-none text-gray-700 placeholder-gray-400 custom-input"
                    />
                </div>

                <button
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
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

                {/* Add Media Button */}
                <button
                    className="text-gray-500 hover:text-gray-700 focus:outline-none mx-3"
                    onClick={() => document.getElementById('fileInput').click()}
                >
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
                </button>
                <input
                    type="file"
                    id="fileInput"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />

                {showEmojiPicker && renderEmojiPicker()}
            </div>
        </div>
    );
}

export default ChatTextBox;