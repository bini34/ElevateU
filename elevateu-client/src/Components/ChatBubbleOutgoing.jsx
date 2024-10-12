// components/ChatBubbleOutgoing.js

import React from 'react';
import ChatAttachment from './ui/ChatAttachment';
import ChatVoiceNote from './ui/ChatVoiceNote';
import ChatImageGallery from './ui/ChatImageGallery';
import ChatUrlPreview from './ui/ChatUrlPreview';

const ChatBubbleOutgoing = ({ message }) => {
  return (
    <div className={`flex items-start gap-2.5 justify-end`}>
      <div className="flex flex-col gap-1 w-full max-w-[320px]">
        <div className="flex items-center justify-end space-x-2">
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{message.time}</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{message.senderName}</span>
        </div>
        {renderMessageContent(message.type, message.content)}
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 text-right">{message.status}</span>
      </div>
      <img className="w-8 h-8 rounded-full" src={message.avatar} alt={`${message.senderName}'s avatar`} />
    </div>
  );
};

const renderMessageContent = (type, content) => {
  switch (type) {
    case 'text':
      return (
        <div className="flex flex-col leading-1.5 p-4 border-gray-200 bg-blue-100 rounded-e-xl dark:bg-blue-700">
          <p className="text-sm font-normal text-gray-900 dark:text-white">{content}</p>
        </div>
      );
    case 'voiceNote':
      return <ChatVoiceNote content={content} />;
    case 'file':
      return <ChatAttachment content={content} />;
    case 'imageGallery':
      return <ChatImageGallery content={content} />;
    case 'urlPreview':
      return <ChatUrlPreview content={content} />;
    default:
      return null;
  }
};

export default ChatBubbleOutgoing;