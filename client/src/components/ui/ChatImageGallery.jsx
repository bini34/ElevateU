// components/ChatImageGallery.js
import Image from 'next/image';

const ChatImageGallery = ({ content }) => {
  return (
    <div className="grid gap-4 grid-cols-2 my-2.5">
      {content.images.map((img, index) => (
        <div key={index} className="group relative">
          <Image 
            src={img.url} 
            alt={img.alt} 
            width={500} // Set a width based on your layout needs
            height={500} // Set a height based on your layout needs
            className="rounded-lg" 
            layout="responsive"
          />
        </div>
      ))}
    </div>
  );
};

export default ChatImageGallery;
