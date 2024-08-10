
export default function Signin() {

  return (
    <div className='w-[500px] flex flex-col mx-auto my-5 justify-center gap-3 px-5   xxs:px-15 md:w-[500px]  '>
      <div>
        <img src='/' alt="" />
      </div>
      <div className='flex flex-col w-full gap-1 mb-4 '>
        <h1 className='text-[40px]'> <span className='text-red-500'>Welcome</span>  <br /> back!</h1>
        <p className='text-[#c7c7c7bb]'>Sign in to unlock your personal growth journey and stay updated with real-time insights.</p>
      </div>
      <div className='flex flex-col gap-5'>  
          <div className="relative ">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3.5  pointer-events-none">
              <svg className="w-4 h-4 text-[#C7C7C7]  dark:text-[#C7C7C7]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 16">
                  <path d="m10.036 8.278 9.258-7.79A1.979 1.979 0 0 0 18 0H2A1.987 1.987 0 0 0 .641.541l9.395 7.737Z"/>
                  <path d="M11.241 9.817c-.36.275-.801.425-1.255.427-.428 0-.845-.138-1.187-.395L0 2.6V14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2.5l-8.759 7.317Z"/>
              </svg>
            </div>
            <input type="text" id="input-group-1" className="bg-white border-1 border-black text-gray-900  ring-1 ring-[#E0DEDE] text-sm rounded-3xl focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-white dark:border-white dark:placeholder-gray-400 dark:text-black dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Enter your Email"/>
          </div>
          <div className="relative ">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none border-3 border-black">
              <svg className="w-6 h-6 text-[#C7C7C7] dark:text-[#C7C7C7]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 16">
                    <path fill="#C7C7C7" d="M 8 1 C 5.796781 1 4 2.796781 4 5 L 4 6 L 3.5 6 C 2.6774686 6 2 6.6774686 2 7.5 L 2 12.5 C 2 13.322531 2.6774686 14 3.5 14 L 12.5 14 C 13.322531 14 14 13.322531 14 12.5 L 14 7.5 C 14 6.6774686 13.322531 6 12.5 6 L 12 6 L 12 5 C 12 2.796781 10.203219 1 8 1 z M 8 2 C 9.662781 2 11 3.337219 11 5 L 11 6 L 5 6 L 5 5 C 5 3.337219 6.337219 2 8 2 z M 3.5 7 L 12.5 7 C 12.781469 7 13 7.2185314 13 7.5 L 13 12.5 C 13 12.781469 12.781469 13 12.5 13 L 3.5 13 C 3.2185314 13 3 12.781469 3 12.5 L 3 7.5 C 3 7.2185314 3.2185314 7 3.5 7 z M 5 9 A 1 1 0 0 0 4 10 A 1 1 0 0 0 5 11 A 1 1 0 0 0 6 10 A 1 1 0 0 0 5 9 z M 8 9 A 1 1 0 0 0 7 10 A 1 1 0 0 0 8 11 A 1 1 0 0 0 9 10 A 1 1 0 0 0 8 9 z M 11 9 A 1 1 0 0 0 10 10 A 1 1 0 0 0 11 11 A 1 1 0 0 0 12 10 A 1 1 0 0 0 11 9 z"></path>
              </svg>
            </div>
            <input type="password" id="password" className="bg-white border border-black > * text-gray-900 text-sm rounded-3xl ring-1 ring-[#E0DEDE] focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-white dark:border-white dark:placeholder-gray-400 dark:text-black h- dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Enter your Password"/>
          </div>
            <div className="flex justify-between">
              <div className="flex">
                <div className="flex items-center h-5">
                  <input id="remember" type="checkbox" value="" className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800" required />
                </div>
                <label  className="ms-2 text-sm font-medium text-gray-950 dark:text-gray-300">Remember me</label>
              </div>
              <a className='text-base text-[#bfdaf9]' href="#"> Forget your password</a>
            </div>
          <button className='bg-red-500 text-lg text-white w-full py-2 rounded-3xl hover:bg-red-400'>Sign In</button>
      </div>
      <div className="relative flex items-center justify-center w-full">
        <hr className="w-full h-px my-8 bg-gray-200 border-0 dark:bg-[#C7C7C7]"/>
        <span className="absolute px-3 font-medium text-gray-900 bg-white dark:text-gray dark:bg-white left-1/2 transform -translate-x-1/2">or</span>
      </div>

      <div className="flex gap-2 max-[520px]:flex-col">
        <button type="button" className="text-black bg-white border-black ring-1 ring-[#E0DEDE]  border-3 w-full h-11 hover:bg-[#3b5998]/90 hover:text-white focus:ring-4 focus:outline-none focus:ring-[#3b5998]/50 font-medium rounded-3xl text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#3b5998]/55 me-2 mb-2">
          <svg className="w-7 h-7 me-2" aria-hidden="true" fill="currentColor" viewBox="0 0 18 19">
              <image href="/icons/facebook.svg" height="100%" width="100%" />
          </svg>
          Sign in with Facebook
        </button>
        <button type="button" className="text-black ring-1 ring-[#E0DEDE] bg-white w-full h-11 hover:bg-[#4285F4]/90 hover:text-white focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-3xl text-sm px-5 py-2.5 text-center flex  align-middle dark:focus:ring-[#4285F4]/55 me-2 mb-2">
          <svg className="w-7 h-7 me-2" aria-hidden="true" fill="currentColor" viewBox="0 0 18 19">
            <image href="/icons/google.svg" height="100%" width="100%" />
          </svg>
            Sign in with Google
        </button>
      </div>
      <div>
        <p className='text-[#c7c7c7bb] text-center'>Don't have an account? <a className='text-red-500' href="/signup">Sign up</a></p>
      </div>
    </div>
  )
}
