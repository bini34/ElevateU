"use client";
import Image from "next/image";
import { useState, useContext } from "react";
// import { useSignIn } from "@/hooks/useSignIn";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { signIn } from "@/lib/auth";

export default function Signin() {
  // const { signIn, loading, error } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { authUser, login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    const data = await signIn(email, password);
      console.log("data from signin", data)
      if (data?.status === "success") {
        login(data.data.user, data.data.token);
        
        toast.success("Login successful!", {
          duration: 3000,
          position: "top-center",
          style: { background: "#4CAF50", color: "#fff" },
        });
        setLoading(false);
        router.push("/");
      } else {
        toast.error(data.message, {
          duration: 3000,
          position: "top-center",
          style: { background: "#FF4719", color: "#fff" },
        });
        setEmail("");
        setPassword("");
        setLoading(false);
      }
      setLoading(false);
  
  };

  return (
    <div className="w-[500px] flex flex-col mx-auto my-5 justify-center gap-3 px-5 xxs:px-15 md:w-[500px]">
      <Toaster />
      <div className="flex justify-center">
        <Image src="/logo/logo.png" alt="Logo" width={100} height={100} />
      </div>
      <div className="flex flex-col w-full gap-1 mb-4">
        <h1 className="text-[40px]">
          <span className="text-red-500">Welcome</span>
          <br /> back!
        </h1>
        <p className="text-[#c7c7c7bb]">
          Sign in to unlock your personal growth journey and stay updated with real-time insights.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-[#C7C7C7]"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 16"
            >
              <path d="m10.036 8.278 9.258-7.79A1.979 1.979 0 0 0 18 0H2A1.987 1.987 0 0 0 .641.541l9.395 7.737Z" />
              <path d="M11.241 9.817c-.36.275-.801.425-1.255.427-.428 0-.845-.138-1.187-.395L0 2.6V14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2.5l-8.759 7.317Z" />
            </svg>
          </div>
          <input
            type="email"
            id="email"
            aria-label="Email"
            className="bg-white border-1 border-black text-gray-900 ring-1 ring-[#E0DEDE] text-sm rounded-3xl focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            placeholder="Enter your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-6 h-6 text-[#C7C7C7]"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 16"
            >
              <path d="M8 1c-2.203 0-4 1.797-4 4v1H3.5c-.822 0-1.5.677-1.5 1.5v5c0 .823.678 1.5 1.5 1.5h9c.823 0 1.5-.677 1.5-1.5v-5c0-.823-.677-1.5-1.5-1.5H12V5c0-2.203-1.797-4-4-4z" />
            </svg>
          </div>
          <input
            type="password"
            id="password"
            aria-label="Password"
            className="bg-white border border-black text-gray-900 text-sm rounded-3xl ring-1 ring-[#E0DEDE] focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            placeholder="Enter your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          className="bg-red-500 text-lg text-white w-full py-2 rounded-3xl hover:bg-red-400"
          disabled={loading}
        >
          {loading ? "Loading..." : "Sign In"}
        </button>
      </form>
      <div className="relative flex items-center justify-center w-full">
        <hr className="w-full h-px my-8 bg-gray-200 border-0 dark:bg-[#C7C7C7]"/>
        <span className="absolute px-3 font-medium text-gray-900 bg-inherit dark:text-gray left-1/2 transform -translate-x-1/2">or</span>
      </div>

      <div className="flex gap-2 flex-col md:flex-row">
        <button type="button" className="text-black bg-white border-black ring-1 ring-[#E0DEDE] border-3 w-full h-11 hover:bg-[#3b5998]/90 hover:text-white focus:ring-4 focus:outline-none focus:ring-[#3b5998]/50 font-medium rounded-3xl text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#3b5998]/55 me-2 mb-2">
        <div className="flex items-center justify-center">
          <svg className="w-7 h-7 me-2" aria-hidden="true" fill="currentColor" viewBox="0 0 18 19">
            <image href="/icons/facebook.svg" height="100%" width="100%" />
          </svg>
          Sign in with Facebook
        </div>
        </button>
        <button type="button" className="text-black ring-1 ring-[#E0DEDE] bg-white w-full h-11 hover:bg-[#4285F4]/90 hover:text-white focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-3xl text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#4285F4]/55 me-2 mb-2">
          <svg className="w-7 h-7 me-2" aria-hidden="true" fill="currentColor" viewBox="0 0 18 19">
            <image href="/icons/google.svg" height="100%" width="100%" />
          </svg>
          Sign in with Google
        </button>
      </div>
      <div>
        <p className="text-[#c7c7c7] text-center">Don't have an account? <a href="/signup" className="text-red-500">Sign up</a></p>
      </div>
    </div>
  );
}
