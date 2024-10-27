// components/ChatUrlPreview.js

import React from 'react';

const ChatUrlPreview = ({ content }) => {
  return (
    <div className="flex flex-col leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-e-xl dark:bg-gray-700">
      <p className="text-sm font-normal py-2.5 text-gray-900 dark:text-white">{content.text}</p>
      <a href={content.url} className="text-blue-700 dark:text-blue-500 underline hover:no-underline font-medium break-all">
        {content.url}
      </a>
    </div>
  );
};

export default ChatUrlPreview;
