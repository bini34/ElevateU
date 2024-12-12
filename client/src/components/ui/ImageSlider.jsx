"use client";
import Image from 'next/image';
import { useState } from 'react';

const SocialMediaPostCarousel = ({ files }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const baseURL = "http://localhost:8080";

  const mediaItems = files.map(file => ({
    type: file.mime.startsWith('image') ? 'image' : 'video',
    src: `${baseURL}${file.path}`,
  }));

  console.log('Media Items:', mediaItems);
  console.log('Active Index:', activeIndex);

  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % mediaItems.length);
  };

  const handlePrev = () => {
    setActiveIndex((prevIndex) =>
      prevIndex === 0 ? mediaItems.length - 1 : prevIndex - 1
    );
  };

 

  return (
    <div id="social-media-carousel" className="relative w-full rounded-3xl" data-carousel="slide">
      <div className="relative  min-h-96  overflow-hidden rounded-3xl">
        {mediaItems.map((item, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${index === activeIndex ? 'block' : 'hidden'}`}
            data-carousel-item={index === activeIndex ? 'active' : ''}
          >
            {console.log("item.src",item.src)}
            {item.type === 'image' ? (
              <Image
                src={item.src}
                fill 
                alt={`Slide ${index + 1}`}
                className="object-cover"
              />
            ) : (
              <video
                src={item.src}
                className="block w-full h-full object-cover"
                controls
                autoPlay
                loop
                muted
              />
            )}
          </div>
        ))}
      </div>

      {/* Controls */}
      {activeIndex > 0 && (
        <button
          type="button"
          className="absolute top-[50%] left-0 z-30 flex items-center justify-center  px-2 cursor-pointer"
          onClick={handlePrev}
          data-carousel-prev
        >
          <span className="inline-flex items-center justify-center w-5 h-5 bg-white bg-opacity-50 rounded-full">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </span>
        </button>
      )}
      {activeIndex < mediaItems.length - 1 && (
        <button
          type="button"
          className="absolute top-[50%] right-0 z-30 flex items-center justify-center  px-2 cursor-pointer"
          onClick={handleNext}
          data-carousel-next
        >
          <span className="inline-flex items-center justify-center w-5 h-5 bg-white bg-opacity-50 rounded-full">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
};

export default SocialMediaPostCarousel;
