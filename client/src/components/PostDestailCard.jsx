import React from 'react';
// import SocialMediaPostCarousel from './SocialMediaPostCarousel';

export default function PostDestailCard() {
  return (
    <div className="bg-white w-[1000px] h-[700px] rounded-lg shadow-lg flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
             {/* <SocialMediaPostCarousel/> */}
             <div className='w-full h-full flex'>
              </div>
            <div className='w-[50%] h-full border border-red-500'>
              <p>hello</p>
            </div>

    </div>
  )
}
