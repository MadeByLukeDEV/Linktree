import { Skeleton } from "@/components/ui/skeleton";

export function YoutubeSkeleton() {
  return (
    <div className="flex w-full flex-col gap-[clamp(0.5rem,2vw,0.75rem)] sm:flex-row">
      <Skeleton className="aspect-video w-full flex-1 rounded-xl" />
      <Skeleton className="aspect-video w-full flex-1 rounded-xl" />
    </div>
  );
}
