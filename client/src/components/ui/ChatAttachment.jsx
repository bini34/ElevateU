// components/ChatAttachment.js

import React from 'react';
import ChatImageGallery from './ChatImageGallery';

const ChatAttachment = ({ content }) => {
  const isImage = content.mime.startsWith('image/');

  if (isImage) {
    return <ChatImageGallery content={{ images: [{ url: content.path, alt: content.name }] }} />;
  }

  return (
    <div className="flex flex-col leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-e-xl dark:bg-gray-700">
      <div className="flex items-start bg-gray-50 dark:bg-gray-600 rounded-xl p-2">
        <div className="me-2">
          <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white pb-2">
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 21">...</svg>
            {content.name}
          </span>
          <span className="flex text-xs font-normal text-gray-500 dark:text-gray-400 gap-2">
            {(content.size / 1024 / 1024).toFixed(2)} MB • {content.mime.toUpperCase()}
          </span>
          <a
            href={content.path}
            download={content.name}
            className="text-blue-700 dark:text-blue-500 underline hover:no-underline font-medium"
          >
            Download
          </a>
        </div>
      </div>
    </div>
  );
};

export default ChatAttachment;
