import Image from 'next/image';
import avator from '../../public/logo/logo.png';

export default function Messagelist(){
  return (
    <>
    <div className="flex items-center  gap-4 w-full">
      <div className="relative">
        <Image className="rounded-full" width={40} height={40} src={avator} alt="avatar" />
        <span className="bottom-0 left-7 absolute w-3.5 h-3.5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></span>
      </div>
    
        <div  className="font-medium dark:text-white hide-on-100px">
          <div className="font-bold">Jese Leos</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Joined in August 2014</div>
        </div>
      
    </div>
      <div className="flex items-center gap-4 w-full">
        <div className="relative">
            <Image className="rounded-full" width={40} height={40} src={avator} alt="avatar" />
            <span className="bottom-0 left-7 absolute w-3.5 h-3.5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></span>
        </div>
            <div  className="font-medium dark:text-white hide-on-100px">
                <div className="font-bold">Jese Leos</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Joined in August 2014</div>
            </div>
    </div>
    </>
  );
}