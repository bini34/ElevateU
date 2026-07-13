// Loading placeholder matching the PostCard layout.
export default function PostSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 w-full sm:w-[450px] animate-pulse" data-testid="post-skeleton">
      <div className="flex flex-col p-2 rounded-3xl gap-3 bg-[#f4f4f4] w-full">
        <div className="flex items-center gap-2 w-full pl-2 pt-1">
          <div className="w-[30px] h-[30px] rounded-full bg-gray-300" />
          <div className="flex flex-col gap-1">
            <div className="h-3 w-28 bg-gray-300 rounded" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="flex flex-col gap-2 pl-2 pb-3">
          <div className="h-3 w-full bg-gray-200 rounded" />
          <div className="h-3 w-3/4 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
