// components/ChatImageGallery.js

import React from 'react';

const ChatImageGallery = ({ content }) => {
  return (
    <div className="grid gap-4 grid-cols-2 my-2.5">
      {content.images.map((img, index) => (
        <div key={index} className="group relative">
          <img src={img.url} className="rounded-lg" alt={img.alt} />
        </div>
      ))}
    </div>
  );
};

export default ChatImageGallery;
