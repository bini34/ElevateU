
import React, { useState, useRef, useEffect } from 'react';
import SocialMediaPostCarousel from './ui/ImageSlider';
import EmojiPicker from 'emoji-picker-react';
import ReactDOM from 'react-dom';
import { AuthContext } from '@/context/AuthContext';
// Mock data structure (you can replace this with your API data)
const initialComments = [
  {
    id: 1,
    username: 'cocheese57',
    text: 'Miss this guy....',
    likes: 47,
    timePosted: '6h',
    isLiked: false,
  },
  {
    id: 2,
    username: 'kamalsolanki_27',
    text: 'Legend ❤️',
    likes: 1,
    timePosted: '3h',
    isLiked: false,
  }
];

export default function PostDetailCard() {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [postLikes, setPostLikes] = useState(72361);
  const [isPostLiked, setIsPostLiked] = useState(false);
  const emojiPickerRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { authUser: user } = useContext(AuthContext);

  // Handle clicking outside emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePostLike = () => {
    setIsPostLiked(!isPostLiked);
    setPostLikes(prev => isPostLiked ? prev - 1 : prev + 1);
  };
  const handleEmojiClick = (emojiObject) => {
    if (emojiObject && emojiObject.emoji) {
      setNewComment(prevComment => prevComment + emojiObject.emoji);
    }
  };

  const renderEmojiPicker = () => {
    return ReactDOM.createPortal(
      <div 
        ref={emojiPickerRef} 
        className="absolute bottom-5 right-10 z-50 transform -translate-x-1/2"
        style={{
          // Adjust these values based on your needs
          width: '320px',
          height: '450px'
        }}
      >
        <EmojiPicker 
          onEmojiClick={handleEmojiClick}
          width="100%"
          height="100%"
          searchPlaceholder="Search emojis..."
          previewConfig={{
            showPreview: false
          }}
        />
      </div>,
      document.body
    );
  };
  const handleCommentLike = (commentId) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          isLiked: !comment.isLiked
        };
      }
      return comment;
    }));
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const newCommentObj = {
      id: comments.length + 1,
      username: 'current_user', // Replace with actual logged-in username
      text: newComment,
      likes: 0,
      timePosted: 'now',
      isLiked: false,
    };

    setComments([...comments, newCommentObj]);
    setNewComment('');
    setShowEmojiPicker(false);
  };

  return (
    <div className="bg-white w-[1000px] h-[700px] rounded-lg shadow-lg flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
      <div className='w-full h-full flex md:flex-row flex-col scrollbar-hide overflow-y-auto'>
        {/* Left side - presumably for image/carousel */}
        <div className='md:w-[50%] w-full h-full'>
          {/* <SocialMediaPostCarousel/> */}
        </div>

        {/* Right side - comments section */}
        <div className='md:w-[50%] w-full h-full flex flex-col'>
          {/* Comments container */}
          <div className='flex-1 overflow-y-auto px-4'>
            <header className='w-full flex gap-5'>
                    <Image 
                        className="rounded-full" 
                        width={40} 
                        height={40} 
                        src={user?.profile_picture_url || avatar} 
                        alt="avatar" 
                    />
                    <div className="font-bold">
                    </div>
                
            </header>
            {comments.map((comment) => (
              <div key={comment.id} className='flex items-start gap-3 py-3'>
                <div className='w-8 h-8 rounded-full bg-gray-200'></div>
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-semibold text-sm'>{comment.username}</span>
                    <span className='text-sm text-gray-500'>{comment.text}</span>
                  </div>
                  <div className='flex items-center gap-2 mt-1 text-xs text-gray-500'>
                    <span>{comment.timePosted}</span>
                    <span>{comment.likes} likes</span>
                    <button className='font-semibold'>Reply</button>
                  </div>
                </div>
                <button 
                  className={`${comment.isLiked ? 'text-red-500' : 'text-gray-400'} hover:text-gray-600`}
                  onClick={() => handleCommentLike(comment.id)}
                >
                  <svg className="w-4 h-4" fill={comment.isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Post actions */}
          <div className='border-t px-4 py-2'>
            <div className='flex gap-4 py-2'>
              <button 
                className={`${isPostLiked ? 'text-red-500' : 'text-gray-800'} hover:text-gray-600`}
                onClick={handlePostLike}
              >
                <svg className="w-6 h-6" fill={isPostLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <span className='text-sm font-semibold'>{postLikes.toLocaleString()} likes</span>
            </div>
            <div className='text-xs text-gray-500'>6 hours ago</div>
          </div>

          {/* Comment input */}
          <div className='border-t px-4 py-3 flex items-center gap-2 relative'>
            <div className="relative">
              <button 
                className='text-2xl text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center'
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker(!showEmojiPicker);
                }}
              >
                  <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z"></path>
                    </svg>
              </button>
              {showEmojiPicker && renderEmojiPicker()}
            </div>
            <input 
              type="text" 
              placeholder="Add a comment..." 
              className='flex-1 text-sm outline-none'
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
            />
            <button 
              className={`${newComment.trim() ? 'text-blue-500 hover:text-blue-600' : 'text-blue-300'} font-semibold text-sm`}
              onClick={handleAddComment}
              disabled={!newComment.trim()}
            >
              Post
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
