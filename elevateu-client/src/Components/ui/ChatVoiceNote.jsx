// components/ChatVoiceNote.js

import React from 'react';

const ChatVoiceNote = ({ content }) => {
  return (
    <div className="flex items-center p-4 border-gray-200 bg-gray-100 rounded-e-xl dark:bg-gray-700">
      <button className="inline-flex self-center items-center p-2 bg-gray-100 rounded-lg dark:bg-gray-700">
        <svg className="w-4 h-4" viewBox="0 0 12 16">...</svg>
      </button>
      <span className="inline-flex self-center items-center p-2 text-sm font-medium text-gray-900 dark:text-white">{content.duration}</span>
    </div>
  );
};

export default ChatVoiceNote;
