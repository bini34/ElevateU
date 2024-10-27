import Image from 'next/image';
import avator from '../../../../public/images/avator.png';

export default function ChangeProfile() {
    return (
            <div className="w-full">

                <header className="w-full">
                    <div className="flex items-end  justify-between gap-4 bg-gray-100 p-2 pb-4 px-4 rounded-b-[3rem] h-[200px]">
                        <div className="flex items-center  gap-4 ">
                            <Image className="rounded-full" width={40} height={40} src={ avator} alt="avatar" />
                            <div className="flex flex-col">
                                <p>Name</p>
                                <p>username</p>
                            </div>
                        </div>
                        <button className="bg-red-600 text-white px-4 py-2 rounded-md">update</button>
                    </div>
                    <div className="flex flex-col gap-2 pl-4  pt-4 w-[300px]">
                        <textarea type="text" placeholder="bio" className="border-2 border-black rounded-md p-2"     />
                        <input type="text" placeholder="location" className="border-2 border-black rounded-md p-2" />
                        <input type="date" placeholder="birthday" className="border-2 border-black rounded-md p-2" />

                    </div>
                </header>
            </div>
    );
}
