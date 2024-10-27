// pages/PostCard.tsx
"use client";
import Image from 'next/image';
import avator from '../../public/logo/logo.png';
import React, { useState } from 'react';
import PostDestailCard from '@/components/PostDestailCard'
import SocialMediaPostCarousel from './ui/ImageSlider';

export default function PostCard(postData) {
  const [isLiked, setIsLiked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLikeClick = () => {
    setIsLiked(!isLiked);
  };

  const handleCommentClick = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  console.log("postData",postData);
  return (
    <article className="flex flex-col items-center p-2 rounded-3xl gap-2 relative bg-[#f4f4f4]">
      <div className="flex items-center gap-2 w-full pl-2">
        <Image className="rounded-full" width={30} height={30} src={avator} alt="avatar" />
        <div className="font-normal dark:text-white">
          <div className="text-sm">{postData.post.user.profile.first_name} {postData.post.user.profile.last_name}</div> {/* Example of using fetched data */}
          <div className="text-sm text-gray-500 dark:text-gray-400">@{postData.post.user.user_name}</div>
        </div>
      </div>
      {postData.post.content && (
      <div className='pb pl-2 w-full'>
        <p className='text-left'>{postData.post.content}</p>
      </div>
      )}
       <SocialMediaPostCarousel files={postData.post.attachments}/>
     
      <div className=' flex justify-between w-full absolute  bottom-2 px-4 py-2 bg-slate-400 bg-opacity-40 rounded-b-full z-10'>
        <div className='flex gap-3'>
          <button onClick={handleLikeClick} className={`like-button ${isLiked ? 'liked' : ''}`}>
            <svg aria-label="Like" className="text-white" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24">
              <title>Like</title>
              <path d={isLiked ? "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" : "M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"}></path>
            </svg>
          </button>
          <button onClick={handleCommentClick}>
            <svg aria-label="Comment" className="text-white" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24">
              <title>Comment</title>
              <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </button>
        </div>
        <div className='flex gap-3'>
          <button>
            <svg aria-label="Share" className="text-white" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24">
              <title>Share</title>
              <line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="3" y2="10.083"></line>
              <polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></polygon>
            </svg>
          </button>
          <button>
            <svg aria-label="Save" className="text-white" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24">
              <title>Save</title>
              <polygon fill="none" points="20 21 12 13.44 4 21 4 3 20 3 20 21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></polygon>
            </svg>
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50" onClick={closeModal}>
          <PostDestailCard/>
        </div>
      )}
    </article>
  );
}
