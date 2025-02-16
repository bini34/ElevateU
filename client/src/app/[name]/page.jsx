import Layout from '@/components/Layout';
import Image from 'next/image';

export default async function Page({ params }) {
    const { name } = params;

    return (
        <Layout>
            <div className="flex flex-col w-full bg-white">
                {/* Header with back button */}
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md p-4 flex items-center gap-6">
                    <button className="p-2 rounded-full hover:bg-gray-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="font-bold text-xl">{name}</h1>
                    </div>
                </div>

                {/* Profile Section */}
                <div className="relative">
                    {/* Banner Image */}
                    <div className="h-32 bg-red-500 relative"></div>
                    
                    {/* Profile Image */}
                    <div className="absolute left-4 -bottom-16">
                        <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden">
                            <Image
                                src="/path-to-profile-image.jpg" // Add your profile image path
                                alt="Profile"
                                width={96}
                                height={96}
                                className="object-cover"
                            />
                        </div>
                    </div>

                    {/* Edit Profile Button */}
                    <div className="flex justify-end p-4">
                        <button className="px-4 py-1.5 rounded-full border border-gray-300 font-semibold hover:bg-gray-50">
                            Edit Profile
                        </button>
                    </div>
                </div>

                {/* Profile Info */}
                <div className="px-4 pt-4">
                    <h2 className="font-bold text-xl">{name}</h2>
                    <p className="text-gray-500">@{name.toLowerCase()}</p>
                    <p className="mt-3">Designing Products that Users Love</p>
                    
                    {/* Following/Followers */}
                    <div className="flex gap-4 mt-3">
                        <span className="hover:underline cursor-pointer">
                            <span className="font-semibold">143</span> Following
                        </span>
                        <span className="hover:underline cursor-pointer">
                            <span className="font-semibold">149</span> Followers
                        </span>
                    </div>
                </div>

                {/* Photo Grid */}
                <div className="grid grid-cols-2 gap-0.5 mt-4">
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <div key={item} className="aspect-square relative bg-gray-100">
                            <Image
                                src={`/path-to-image-${item}.jpg`} // Add your image paths
                                alt={`Grid image ${item}`}
                                fill
                                className="object-cover"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
