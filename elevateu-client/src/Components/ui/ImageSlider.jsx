"use client"
import { useState } from "react";
import x from '../../../public/images/1.jpg';
import y from '../../../public/images/2.jpg';

const SocialMediaPostCarousel = () => {


  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div id="social-media-carousel" className="relative w-full" data-carousel="slide">
      {/* Carousel Wrapper */}
      <div className="relative h-64 md:h-96 overflow-hidden rounded-lg">
        
        {/* Image Slide 1 */}
        <div className="hidden duration-700 ease-in-out" data-carousel-item>
          <img
            src={x}
            className="absolute block w-[100px] h-full object-cover"
            alt="Slide 1"
          />
        </div>
        
        {/* Video Slide 2 */}
        {/* <div className="hidden duration-700 ease-in-out" data-carousel-item="active">
          <video
            className="absolute block w-full h-full object-cover"
            muted={isMuted}
            loop
            autoPlay
            src="/path/to/video1.mp4"
          />
          <button
            className="absolute bottom-5 right-5 bg-gray-700 text-white p-2 rounded-full"
            onClick={toggleMute}
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>
        </div> */}
        
        {/* Image Slide 3 */}
        <div className="hidden duration-700 ease-in-out" data-carousel-item>
          <img
            src={y}
            className="absolute block w-[100px] h-full object-cover"
            alt="Slide 2"
          />
        </div>

        {/* Additional slides here (video or images) */}
      </div>

      {/* Indicators */}
      <div className="absolute z-30 flex -translate-x-1/2 bottom-5 left-1/2 space-x-3">
        <button type="button" className="w-3 h-3 rounded-full" data-carousel-slide-to="0" aria-label="Slide 1"></button>
        <button type="button" className="w-3 h-3 rounded-full" data-carousel-slide-to="1" aria-label="Slide 2"></button>
        <button type="button" className="w-3 h-3 rounded-full" data-carousel-slide-to="2" aria-label="Slide 3"></button>
      </div>

      {/* Controls */}
      <button
        type="button"
        className="absolute top-0 left-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer"
        data-carousel-prev
      >
        <span className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-full">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </span>
      </button>
      <button
        type="button"
        className="absolute top-0 right-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer"
        data-carousel-next
      >
        <span className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-full">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </button>
    </div>
  );
};

export default SocialMediaPostCarousel;
