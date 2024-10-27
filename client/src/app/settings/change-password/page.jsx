export default function ChangePassword() {
    return (
        <div className="flex flex-col gap-4 m-auto w-[500px] border-2 border-neutral-400 rounded-md p-4">
            <h1 className="text-2xl text-center font-bold pb-8">Change Password</h1>
            <input type="password" placeholder="old password" className="border-2 border-neutral-400 rounded-md p-2" />
            <input type="password" placeholder="new password" className="border-2 border-neutral-400 rounded-md p-2" />
            <input type="password" placeholder="confirm password" className="border-2 border-neutral-400 rounded-md p-2" />
            <button className="bg-red-600 text-white px-4 py-4 rounded-md">update</button>
        </div>
    );
}