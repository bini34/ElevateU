import Image from 'next/image';
import avator from '../../public/logo/logo.png';

export default function Messagelist(){
    return(
        <>
           <div className="flex items-center gap-4 w-full">
                <Image className=" rounded-full" width={40} height={40} src={avator} alt="huh"/>
                <div className="font-medium dark:text-white">
                    <div className='font- font-bold'>Jese Leos</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Joined in August 2014</div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <Image className=" rounded-full" width={40} height={40} src={avator} alt=""/>
                <div className="font-medium dark:text-white">
                    <div>Jese Leos</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Joined in August 2014</div>
                </div>
            </div> 
        </>
            
    );

}