"use client"
import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import avator from "../../../public/logo/logo.png";
import { AuthContext } from "@/context/AuthContext";
import { usePost } from "@/hooks/usePost";

export default function CreatePost() {
    const { authUser } = useContext(AuthContext);
    const { post, loading } = usePost();
    const router = useRouter();
    const [content, setContent] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState([]);

    // Object URLs for previews, recreated only when the selection changes
    const previews = useMemo(
        () =>
            uploadedFiles.map((file) => ({
                key: `${file.name}-${file.lastModified}`,
                url: URL.createObjectURL(file),
                isImage: file.type.startsWith('image/'),
                type: file.type,
            })),
        [uploadedFiles]
    );
    useEffect(() => {
        return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    }, [previews]);

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files).slice(0, 10);
        setUploadedFiles(files);
    };

    const removeFile = (key) => {
        setUploadedFiles((files) =>
            files.filter((file) => `${file.name}-${file.lastModified}` !== key)
        );
    };

    const handleSubmit = async () => {
        if (!content.trim() && uploadedFiles.length === 0) {
            toast.error('Write something or add a photo first.');
            return;
        }

        const createdPost = await post(content.trim(), uploadedFiles);
        if (createdPost) {
            toast.success('Post created!');
            router.push('/');
        } else {
            toast.error('Could not create the post. Please try again.');
        }
    };

    const displayName =
        `${authUser?.profile?.first_name ?? ''} ${authUser?.profile?.last_name ?? ''}`.trim() ||
        authUser?.user_name ||
        '';

    return (
        <div className="bg-white p-6 w-full min-h-screen max-w-[600px] mx-auto">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                    <Image
                        className="rounded-full"
                        width={40}
                        height={40}
                        src={authUser?.profile?.profile_picture_URL || avator}
                        alt="Profile"
                    />
                    <span className="ml-2 font-bold">{displayName}</span>
                </div>
                <button
                    onClick={() => router.back()}
                    aria-label="Cancel"
                    className="text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200 px-3 py-1"
                >
                    &times;
                </button>
            </div>

            <textarea
                className="w-full p-2 border rounded custom-input"
                placeholder={`What's on your mind${authUser?.profile?.first_name ? `, ${authUser.profile.first_name}` : ''}?`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={5000}
                rows="4"
            ></textarea>

            <div className="mt-4 w-full grid grid-cols-3 gap-2">
                {previews.map((preview) => (
                    <div key={preview.key} className="relative">
                        {preview.isImage ? (
                            // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not optimizable
                            <img src={preview.url} alt="Preview" className="w-full h-28 object-cover rounded" />
                        ) : (
                            <video controls className="w-full h-28 object-cover rounded">
                                <source src={preview.url} type={preview.type} />
                                Your browser does not support the video tag.
                            </video>
                        )}
                        <button
                            onClick={() => removeFile(preview.key)}
                            aria-label="Remove file"
                            className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center mt-4">
                <label className="p-2 rounded cursor-pointer text-gray-600 hover:text-black" aria-label="Add photos or videos">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                    </svg>
                    <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </label>
                <button
                    className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
                    onClick={handleSubmit}
                    disabled={loading || (!content.trim() && uploadedFiles.length === 0)}
                >
                    {loading ? "Posting..." : "Post"}
                </button>
            </div>
        </div>
    );
}
