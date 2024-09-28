// pages/PostCard.tsx
"use client";
import Image from 'next/image';
import avator from '../../public/logo/logo.png';
//import x from '../../public/images/1.jpg';
// import y from '../../public/images/2.jpg';
// import z from '../../public/images/3.jpg';

import SocialMediaPostCarousel from './ui/ImageSlider';

export default function PostCard() {

  // const slides = [
  //   {
  //     type: 'image',
  //     src: x,
  //     alt: 'Sample Image 1',
  //   },
  //   {
  //     type: 'image',
  //     src: y,
  //     alt: 'Sample Image 2',
  //   },
  //   {
  //     type: 'image',
  //     src: z,
  //     alt: 'Sample Image 3',
  //   },
  // ];

  return (
    <article className="flex flex-col items-center">
      <div className="flex items-center gap-2 w-full">
        <Image className="rounded-full" width={30} height={30} src={avator} alt="avatar" />
        <div className="font-normal dark:text-white">
          <div className="text-sm">Jese Leos</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">@Jese</div>
        </div>
      </div>
      {/* <Image
        src={x}
        width={300}
        height={300}
        alt="Picture of the author"
      /> */}
      <SocialMediaPostCarousel/>
    </article>
  );
}
