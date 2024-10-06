// components/ChatAttachment.js

import React from 'react';

const ChatAttachment = ({ content }) => {
  return (
    <div className="flex flex-col leading-1.5 p-4 border-gray-200 bg-gray-100 rounded-e-xl dark:bg-gray-700">
      <div className="flex items-start bg-gray-50 dark:bg-gray-600 rounded-xl p-2">
        <div className="me-2">
          <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white pb-2">
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 21">...</svg>
            {content.fileName}
          </span>
          <span className="flex text-xs font-normal text-gray-500 dark:text-gray-400 gap-2">
            {content.size} MB • {content.type.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatAttachment;
