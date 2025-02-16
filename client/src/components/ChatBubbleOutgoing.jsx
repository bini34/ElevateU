// components/ChatBubbleOutgoing.js

import React from 'react';
import ChatAttachment from './ui/ChatAttachment';
// import ChatVoiceNote from './ui/ChatVoiceNote';
// import ChatImageGallery from './ui/ChatImageGallery';
// import ChatUrlPreview from './ui/ChatUrlPreview';
import avatar from '../../public/images/avator.png';
import Image from 'next/image';

const ChatBubbleOutgoing = ({ message }) => {
  return (
    <div className="flex items-start gap-2.5 justify-end">
      <div className="flex flex-col w-full max-w-[320px]">
        <div className="flex items-center justify-end space-x-2 mb-1">
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{message.time}</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{message.senderName}</span>
        </div>
        {renderMessageContent(message)}
      </div>
      <Image className="w-8 h-8 rounded-full" src={message.avatar || avatar} alt={`${message.senderName}'s avatar`} />
    </div>
  );
};

const renderMessageContent = (message) => {
  const { type, content, file_attachments, status } = message;

  return (
    <>
      {type === 'text' && (
        <div className="flex flex-col items-end">
          <div className="p-3 bg-blue-100 rounded-2xl rounded-tr-none dark:bg-blue-700 ">
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

export default ChatBubbleOutgoing;
