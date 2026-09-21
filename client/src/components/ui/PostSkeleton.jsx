import { ContentSkeleton } from './Skeleton';
export default function PostSkeleton() {
  return <div className="w-full sm:w-[450px]" data-testid="post-skeleton"><ContentSkeleton variant="post" label="Loading post" /></div>;
}
