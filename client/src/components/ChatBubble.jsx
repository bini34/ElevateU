// components/ChatBubble.js

import React from 'react';
import ChatAttachment from './ui/ChatAttachment';
// import ChatVoiceNote from './ui/ChatVoiceNote';
// import ChatImageGallery from './ui/ChatImageGallery';
// import ChatUrlPreview from './ui/ChatUrlPreview';
import avatar from '../../public/images/avator.png';
import Image from 'next/image';

const ChatBubble = ({ message }) => {
  return (
    <div className="flex items-start gap-2.5">
      <Image
        className="w-8 h-8 rounded-full"
        src={message.avatar || avatar}
        alt={`${message.senderName}'s avatar`}
        width={32}
        height={32}
      />
      <div className="flex flex-col w-full max-w-[320px]">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{message.senderName}</span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{message.time}</span>
        </div>
        {renderMessageContent(message)}
      </div>
    </div>
  );
};

const renderMessageContent = (message) => {
  const { type, content, file_attachments, status } = message;

  return (
    <>
      {type === 'text' && (
        <div className="flex flex-col">
          <div className="p-3 bg-gray-100 rounded-2xl rounded-tl-none dark:bg-gray-700">
            <p className="text-sm font-normal text-gray-900 dark:text-white">{content}</p>
          </div>
          {status && (
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">{status}</span>
          )}
        </div>
      )}
      {file_attachments && file_attachments.map((file) => (
        <ChatAttachment key={file.id} content={file} />
      ))}
    </>
  );
};

export default ChatBubble;
