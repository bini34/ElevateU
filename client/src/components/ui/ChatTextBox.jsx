"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import EmojiPicker from 'emoji-picker-react';

/**
 * Message composer. The parent owns sending:
 *  - onSend(text, files) => Promise<boolean> — resolves true when accepted
 *  - onTyping() — fired while the user types (parent throttles/whispers)
 */
function ChatTextBox({ onSend, onTyping, disabled = false }) {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [message, setMessage] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [showFilePreview, setShowFilePreview] = useState(false);
    const [sending, setSending] = useState(false);
    const emojiPickerRef = useRef(null);

    const previews = useMemo(
        () =>
            selectedFiles.map((file) => ({
                key: `${file.name}-${file.lastModified}`,
                url: URL.createObjectURL(file),
                isImage: file.type.startsWith('image/'),
                isVideo: file.type.startsWith('video/'),
                name: file.name,
            })),
        [selectedFiles]
    );
    useEffect(() => {
        return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    }, [previews]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleEmojiClick = (emojiObject) => {
        if (emojiObject?.emoji) {
            setMessage((prev) => prev + emojiObject.emoji);
        }
    };

    const renderEmojiPicker = () =>
        ReactDOM.createPortal(
            <div ref={emojiPickerRef} className="absolute bottom-10 right-10 z-50">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>,
            document.body
        );

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files).slice(0, 10);
        setSelectedFiles(files);
        setShowFilePreview(files.length > 0);
        event.target.value = ''; // allow picking the same file again later
    };

    const handleSend = async () => {
        const text = message.trim();
        if ((!text && selectedFiles.length === 0) || sending || disabled) return;

        setSending(true);
        try {
            const accepted = await onSend(text, selectedFiles);
            if (accepted) {
                setMessage('');
                setSelectedFiles([]);
                setShowFilePreview(false);
                setShowEmojiPicker(false);
            }
        } finally {
            setSending(false);
        }
    };

    const handleCancel = () => {
        setShowFilePreview(false);
        setSelectedFiles([]);
    };

    const handleChange = (e) => {
        setMessage(e.target.value);
        onTyping?.();
    };

    return (
        <footer className='flex justify-center items-center w-full'>
            <section className="flex bg-[#f4f4f4] rounded-full shadow-md mx-4 my-4 py-2 justify-center items-center w-[90%] px-4 relative">
                <div className="flex-grow mx-3">
                    <input
                        type="text"
                        placeholder="Message..."
                        value={message}
                        maxLength={5000}
                        disabled={disabled}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
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
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z"></path>
                    </svg>
                </button>

                <label htmlFor="fileInput" className="text-gray-500 hover:text-gray-700 focus:outline-none mx-3 cursor-pointer" aria-label="Attach File">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6.549 5.013A1.557 1.557 0 1 0 8.106 6.57a1.557 1.557 0 0 0-1.557-1.557Z" fillRule="evenodd" />
                        <path fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" d="m2 18.605 3.901-3.9a.908.908 0 0 1 1.284 0l2.807 2.806a.908.908 0 0 0 1.283 0l5.534-5.534a.908.908 0 0 1 1.283 0l3.905 3.905" />
                        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.44 2.004A3.56 3.56 0 0 1 22 5.564v12.873a3.56 3.56 0 0 1-3.56 3.56H5.568a3.56 3.56 0 0 1-3.56-3.56V5.563a3.56 3.56 0 0 1 3.56-3.56Z" />
                    </svg>
                </label>
                <input
                    type="file"
                    id="fileInput"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    multiple
                />

                <button
                    className="ml-2 text-blue-500 hover:text-blue-600 disabled:text-gray-400 font-semibold text-sm"
                    onClick={handleSend}
                    disabled={sending || disabled || (!message.trim() && selectedFiles.length === 0)}
                    aria-label="Send message"
                >
                    {sending ? 'Sending…' : 'Send'}
                </button>

                {showEmojiPicker && renderEmojiPicker()}
            </section>

            {showFilePreview && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white w-[500px] max-w-[95vw] p-4 rounded shadow-lg max-h-[80vh] overflow-y-auto">
                        {previews.map((preview) => (
                            <div key={preview.key} className="mb-4">
                                {preview.isImage && (
                                    // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                                    <img src={preview.url} alt="Preview" className="max-h-40 mx-auto rounded" />
                                )}
                                {preview.isVideo && (
                                    <video controls src={preview.url} className="max-h-40 mx-auto rounded" />
                                )}
                                {!preview.isImage && !preview.isVideo && (
                                    <p className="text-sm text-gray-600 text-center">{preview.name}</p>
                                )}
                            </div>
                        ))}
                        <input
                            type="text"
                            placeholder="Message..."
                            value={message}
                            maxLength={5000}
                            onChange={handleChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            className="w-full mb-4 p-2 border rounded custom-input"
                        />
                        <div className="flex justify-end">
                            <button
                                className="text-red-500 px-2 py-2 rounded mr-2"
                                onClick={handleCancel}
                                aria-label="Cancel"
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-black text-white border-2 border-black px-4 py-2 rounded disabled:opacity-50"
                                onClick={handleSend}
                                disabled={sending}
                                aria-label="Send"
                            >
                                {sending ? 'Sending…' : 'Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </footer>
    );
}

export default ChatTextBox;
