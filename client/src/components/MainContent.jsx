import { useState } from "react";
import Image from "next/image";

const MainContent = () => {
  const [posts] = useState([
    {
      id: 1,
      username: "Jane Doe",
      content: {
        type: "image",
        src: "/images/your-image.jpg", // Replace with your image
        caption: "Beautiful aerial view",
      },
    },
    {
      id: 2,
      username: "John Smith",
      content: {
        type: "video",
        src: "https://example.com/sample-video.mp4", // Sample video
        caption: "Check out this amazing timelapse!",
      },
    },
    {
      id: 3,
      username: "Jane Doe",
      content: {
        type: "image",
        src: "/images/your-image.jpg", // Replace with your image
        caption: "Beautiful aerial view",
      },
    },
    {
      id: 4,
      username: "Jane Doe",
      content: {
        type: "image",
        src: "/images/your-image.jpg", // Replace with your image
        caption: "Beautiful aerial view",
      },
    },
  ]);

  return (
    <div className=" w-full md:w-[80%] lg:w-[60%] p-4 md:p-8 space-y-6 overflow-hidden">
      {posts.map((post) => (
        <PostCard key={post.id} {...post} />
      ))}
    </div>
  );
};

const PostCard = ({ username, content }) => {
  return (
    <div className="bg-white w-[100px] rounded-lg shadow-md overflow-hidden">
      <div className="p-4 flex items-center">
        <div className="w-10 h-10 rounded-full bg-gray-300 mr-3"></div>
        <span className="font-semibold">{username}</span>
      </div>

      {content.type === "image" && content.src && (
        <Image
          src={content.src}
          alt={content.caption || "Post image"}
          width={500}
          height={300}
          className="w-full object-cover"
        />
      )}

      {content.type === "video" && content.src && (
        <video src={content.src} controls className="w-full" />
      )}

      {content.caption && <p className="px-4 pb-2">{content.caption}</p>}

      <div className="p-4 flex justify-between">
        <button className="text-blue-500 font-semibold">Like</button>
        <button className="text-blue-500 font-semibold">Comment</button>
        <button className="text-blue-500 font-semibold">Share</button>
      </div>
    </div>
  );
};

export default MainContent;
