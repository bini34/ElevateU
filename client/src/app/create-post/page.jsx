"use client"
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
export default function CreatePost() {
    const { authUser } = useAuth();
    const router = useRouter();
    const [content, setContent] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    return(
        <div className="bg-white p-6 w-full h-full">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center">
                                <Image className="rounded-full" width={40} height={40} src={authUser?.profile.avatar || avator} alt="Profile" />
                                <span className="ml-2 font-bold">{`${authUser?.profile?.first_name} ${authUser?.profile?.last_name}`}</span>
                            </div>
                            <button onClick={toggleModal} className="text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200 px-3 py-1">
                                &times;
                            </button>
                        </div>
                        <textarea
                            className="w-full p-2 border rounded custom-input"
                            placeholder={`What's on your mind, ${authUser?.profile?.first_name}`}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows="4"
                        ></textarea>
                        <div className="mt-4 w-full grid grid-cols-3 gap-2">
                            {uploadedFiles.map((file, index) => (
                                <div key={index} className="mt-2">
                                    {file.type.startsWith('image/') ? (
                                        <Image src={URL.createObjectURL(file)} alt="Preview" fill className="w-full h-auto rounded" />
                                    ) : (
                                        <video controls className="w-full h-auto rounded">
                                            <source src={URL.createObjectURL(file)} type={file.type} />
                                            Your browser does not support the video tag.
                                        </video>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <div className="flex space-x-2">
                                <label className="p-2 rounded cursor-pointer">
                                    <Image className="x1b0d499 xl1xv1r" alt="" src="https://static.xx.fbcdn.net/rsrc.php/v3/y7/r/Ivw7nhRtXyo.png" width={24} height={24} />
                                    <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                                </label>
                            </div>
                            <button className="px-4 py-2 bg-black text-white rounded" onClick={handleSubmit}>
                               {loading ? "Posting..." : "Post"}
                            </button>
                        </div>
                    </div>
    );
}