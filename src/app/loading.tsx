import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <main className="flex flex-1 flex-col items-center gap-[clamp(1.5rem,6vw,2.5rem)] px-[clamp(1rem,6vw,2rem)] py-[clamp(2rem,8vw,4rem)]">
      <div className="flex w-full max-w-md flex-col items-center gap-[clamp(1.5rem,6vw,2.5rem)]">
        <div className="flex flex-col items-center gap-[clamp(0.5rem,2vw,0.75rem)]">
          <Skeleton className="size-[clamp(4rem,20vw,6rem)] rounded-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>

        <div className="flex w-full flex-col gap-[clamp(0.5rem,2vw,0.75rem)]">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    </main>
  );
}
