"use client";
import { useState } from 'react';
import Image from 'next/image';
import avator from '../../public/logo/logo.png';
import x from '../../public/images/1.jpg';
import y from '../../public/images/2.jpg';
import z from '../../public/images/3.jpg';

export default function PostCard() {
    // Define state to keep track of active image
    const [activeIndex, setActiveIndex] = useState(0);

    const images = [x, y, z]; // Add more images if necessary

    // Function to handle next button click
    const handleNext = () => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    // Function to handle previous button click
    const handlePrev = () => {
        setActiveIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    };

    return (
        <article className="flex flex-col items-center">
            {/* User info */}
            <div className="flex items-center gap-2 w-full">
                <Image className="rounded-full" width={30} height={30} src={avator} alt="avatar" />
                <div className="font-normal dark:text-white">
                    <div className="text-sm">Jese Leos</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">@Jese</div>
                </div>
            </div>

            {/* Carousel */}
            <div id="indicators-carousel" className="relative w-[640px] h-[640px] mx-auto mt-4">
                {/* Define the size of the parent container */}
                <div className="relative w-full h-full overflow-hidden rounded-lg">
                    {/* Display the active image */}
                    <Image
                        src={images[activeIndex]}
                        layout="fill"
                        objectFit="cover"
                        className="absolute top-0 left-0"
                        alt={`Image ${activeIndex + 1}`}
                    />
                </div>
                
                {/* Previous button */}
                <button
                    type="button"
                    className="absolute top-1/2 left-2 z-30 transform -translate-y-1/2 flex items-center justify-center h-10 w-10 bg-white/30 dark:bg-gray-800/30 rounded-full group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 focus:outline-none"
                    onClick={handlePrev}
                >
                    <svg className="w-6 h-6 text-white dark:text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 1 1 5l4 4" />
                    </svg>
                    <span className="sr-only">Previous</span>
                </button>
                
                {/* Next button */}
                <button
                    type="button"
                    className="absolute top-1/2 right-2 z-30 transform -translate-y-1/2 flex items-center justify-center h-10 w-10 bg-white/30 dark:bg-gray-800/30 rounded-full group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 focus:outline-none"
                    onClick={handleNext}
                >
                    <svg className="w-6 h-6 text-white dark:text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                    </svg>
                    <span className="sr-only">Next</span>
                </button>
            </div>

            {/* Carousel indicators */}
            <div className="absolute z-30 flex space-x-3 bottom-5 left-1/2 transform -translate-x-1/2">
                {images.map((_, index) => (
                    <button
                        key={index}
                        type="button"
                        className={`w-3 h-3 rounded-full ${index === activeIndex ? 'bg-white' : 'bg-gray-400'}`}
                        onClick={() => setActiveIndex(index)}
                        aria-label={`Slide ${index + 1}`}
                    />
                ))}
            </div>
        </article>
    );
}
