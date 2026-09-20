import { Skeleton, TableSkeleton } from '@/components/ui/primitives';

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
      <Skeleton className="mt-6 h-10 w-full" />
      <div className="mt-3 mb-5 flex gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>
      <TableSkeleton rows={10} />
    </div>
  );
}
