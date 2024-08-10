import Image from "next/image";

export default function Home() {
  return (
   <div className="w-full h-[900px] bg-white  flex pt-7">
    <nav className="w-30 h-full flex  flex-col p-4 pt-9">
          <li>home</li>
          <li>home</li>
          <li>home</li>
          <li>home</li>
          <li>home</li>

    </nav>
    <div className=" flex w-full h-full ring-1 ring-black bg-[#E6EFF9] rounded-s-3xl">
      <div className="w-[25rem]  h-[full] flex flex-col">
       
      </div>
      <div className="w-full h-full ring-1 ring-black bg-white rounded-s-3xl">
        <header className="flex justify-between w-full p-4">
            <h1>ElevateU</h1>
            <input type="text" id="search" className="bg-white border-1 border-black text-gray-900  ring-1 ring-[#E0DEDE] text-sm rounded-lg block w-[25rem]  p-2.5 active:ring-black dark:bg-white dark:border-white dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="enter"/>
          
          <div>

          </div>
        </header>
        <main className="flex flex-col gap-5 mx-auto">
          <div className="w-96 h-96 ring-1 ring-black rounded-xl">


          </div>
          <div className="w-96 h-96 ring-1 ring-black rounded-xl">


          </div>
        </main>
      </div>
    </div>
   </div>
  );
}
