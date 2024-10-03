"use client";
import Image from 'next/image';
import { useState } from 'react';
import x from '../../../public/images/1.jpg';
import y from '../../../public/images/2.jpg';
import z from '../../../public/images/3.jpg';
import i from '../../../public/images/4.jpg';

const SocialMediaPostCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const mediaItems = [
    { type: 'image', src: x },
    { type: 'image', src: y },
    { type: 'image', src: z },
    { type: 'image', src: i },

  ];

  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % mediaItems.length);
  };

  const handlePrev = () => {
    setActiveIndex((prevIndex) =>
      prevIndex === 0 ? mediaItems.length - 1 : prevIndex - 1
    );
  };

  if (mediaItems.length === 0) {
    return <p>No media items available.</p>; 
  }

  return (
    <div id="social-media-carousel" className="relative w-full rounded-3xl" data-carousel="slide">
      {/* Carousel Wrapper */}
      <div className="relative h-auto md:h-96 overflow-hidden rounded-3xl">
        {mediaItems.map((item, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${index === activeIndex ? 'block' : 'hidden'}`}
            data-carousel-item={index === activeIndex ? 'active' : ''}
          >
            {item.type === 'image' ? (
              <Image
                src={item.src}
                alt={`Slide ${index + 1}`}
                fill 
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

      {/* Indicators */}
      {/* <div className="absolute z-30 flex -translate-x-1/2 bottom-5 left-1/2 space-x-3">
        {mediaItems.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`w-2 h-2 rounded-full ${index === activeIndex ? 'bg-white' : 'bg-gray-300'}`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Slide ${index + 1}`}
          ></button>
        ))}
      </div> */}

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
